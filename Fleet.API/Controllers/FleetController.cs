using Fleet.Core.Common;
using Fleet.Core.Services;
using Fleet.Core.ViewModels.Fleets;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Fleet.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FleetController : ControllerBase
{
    private readonly IFleetService _fleetService;

    public FleetController(IFleetService fleetService)
    {
        _fleetService = fleetService;
    }

    [HttpGet]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<PagedResult<FleetListViewModel>>> GetAllFleets([FromQuery] PaginationQuery pagination)
    {
        var fleets = await _fleetService.GetAllFleetsAsync();
        fleets = ApplyTenantScope(fleets);

        var vms = fleets.Select(MapToListViewModel);
        return Ok(PagedResult<FleetListViewModel>.Create(vms, pagination.Page, pagination.PageSize));
    }

    [HttpGet("{id}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<FleetDetailViewModel>> GetFleetById(int id)
    {
        var fleet = await _fleetService.GetFleetByIdAsync(id);
        if (fleet == null)
            return NotFound($"Fleet with ID {id} not found");

        if (!CanAccessTenant(fleet.TenantId))
            return Forbid();

        return Ok(MapToDetailViewModel(fleet));
    }

    [HttpGet("tenant/{tenantId}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<PagedResult<FleetListViewModel>>> GetFleetsByTenantId(int tenantId, [FromQuery] PaginationQuery pagination)
    {
        if (!CanAccessTenant(tenantId))
            return Forbid();

        var fleets = await _fleetService.GetFleetsByTenantIdAsync(tenantId);
        var vms = fleets.Select(MapToListViewModel);
        return Ok(PagedResult<FleetListViewModel>.Create(vms, pagination.Page, pagination.PageSize));
    }

    [HttpGet("active")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<PagedResult<FleetListViewModel>>> GetActiveFleets([FromQuery] PaginationQuery pagination)
    {
        var fleets = await _fleetService.GetActiveFleetsAsync();
        fleets = ApplyTenantScope(fleets);

        var vms = fleets.Select(MapToListViewModel);
        return Ok(PagedResult<FleetListViewModel>.Create(vms, pagination.Page, pagination.PageSize));
    }

    [HttpPost]
    [Authorize(Policy = "RequireManager")]
    public async Task<ActionResult<FleetDetailViewModel>> CreateFleet([FromBody] CreateFleetViewModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // Non-SystemAdmins may only create fleets within their own tenant
        var tenantId = model.TenantId;
        if (!User.IsSystemAdmin())
        {
            var callerTenant = User.GetTenantId();
            if (callerTenant is null)
                return Forbid();
            tenantId = callerTenant.Value;
        }

        var fleet = new Core.Domain.Fleet
        {
            Name = model.Name,
            Description = model.Description,
            Location = model.Location,
            IsActive = model.IsActive,
            TenantId = tenantId
        };

        var created = await _fleetService.CreateFleetAsync(fleet);
        return CreatedAtAction(nameof(GetFleetById), new { id = created.Id }, MapToDetailViewModel(created));
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "RequireManager")]
    public async Task<ActionResult<FleetDetailViewModel>> UpdateFleet(int id, [FromBody] UpdateFleetViewModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (id != model.Id)
            return BadRequest("ID mismatch");

        var existing = await _fleetService.GetFleetByIdAsync(id);
        if (existing == null)
            return NotFound($"Fleet with ID {id} not found");

        if (!CanAccessTenant(existing.TenantId))
            return Forbid();

        existing.Name = model.Name;
        existing.Description = model.Description;
        existing.Location = model.Location;
        existing.IsActive = model.IsActive;

        var updated = await _fleetService.UpdateFleetAsync(existing);
        return Ok(MapToDetailViewModel(updated));
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "CanDelete")]
    public async Task<ActionResult> DeleteFleet(int id)
    {
        var existing = await _fleetService.GetFleetByIdAsync(id);
        if (existing == null)
            return NotFound($"Fleet with ID {id} not found");

        if (!CanAccessTenant(existing.TenantId))
            return Forbid();

        var result = await _fleetService.DeleteFleetAsync(id);
        return result ? NoContent() : NotFound($"Fleet with ID {id} not found");
    }

    // ----- Tenant isolation helpers -----

    private bool CanAccessTenant(int tenantId)
        => User.IsSystemAdmin() || User.GetTenantId() == tenantId;

    private IEnumerable<Core.Domain.Fleet> ApplyTenantScope(IEnumerable<Core.Domain.Fleet> fleets)
    {
        if (User.IsSystemAdmin())
            return fleets;

        var tenantId = User.GetTenantId();
        return tenantId is null ? Enumerable.Empty<Core.Domain.Fleet>() : fleets.Where(f => f.TenantId == tenantId);
    }

    // ----- Mapping helpers -----

    private static FleetListViewModel MapToListViewModel(Core.Domain.Fleet f) => new()
    {
        Id = f.Id,
        Name = f.Name,
        Location = f.Location,
        IsActive = f.IsActive,
        VehicleCount = f.Vehicles?.Count ?? 0
    };

    private static FleetDetailViewModel MapToDetailViewModel(Core.Domain.Fleet f) => new()
    {
        Id = f.Id,
        Name = f.Name,
        Description = f.Description,
        Location = f.Location,
        IsActive = f.IsActive,
        TenantId = f.TenantId,
        TenantName = f.Tenant?.Name,
        VehicleCount = f.Vehicles?.Count ?? 0,
        CreatedAt = f.CreatedAt,
        UpdatedAt = f.UpdatedAt
    };
}
