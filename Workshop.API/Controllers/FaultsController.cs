using Fleet.Core.Common;
using Fleet.Core.Domain;
using Fleet.Core.Services;
using Fleet.Core.ViewModels.Faults;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Workshop.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FaultsController : ControllerBase
{
    private readonly IFaultService _faultService;
    private readonly IJobCardService _jobCardService;

    public FaultsController(IFaultService faultService, IJobCardService jobCardService)
    {
        _faultService = faultService;
        _jobCardService = jobCardService;
    }

    [HttpGet]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<PagedResult<FaultListViewModel>>> GetAll([FromQuery] FaultQuery query)
    {
        IEnumerable<Fault> faults = await _faultService.GetAllFaultsAsync();
        faults = ApplyTenantScope(faults);

        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            faults = faults.Where(f =>
                string.Equals(f.Status, query.Status, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(query.Severity))
        {
            faults = faults.Where(f =>
                string.Equals(f.Severity, query.Severity, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim();
            faults = faults.Where(f =>
                (f.Title?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false) ||
                (f.Description?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false) ||
                (f.Vehicle?.RegistrationNumber?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false));
        }

        var vms = faults
            .OrderByDescending(f => f.ReportedDate)
            .Select(MapToListViewModel);
        return Ok(PagedResult<FaultListViewModel>.Create(vms, query.Page, query.PageSize));
    }

    [HttpGet("{id}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<FaultDetailViewModel>> GetById(int id)
    {
        var fault = await _faultService.GetFaultByIdAsync(id);
        if (fault == null)
            return NotFound($"Fault with ID {id} not found");
        if (!CanAccessTenant(fault.TenantId))
            return Forbid();
        return Ok(MapToDetailViewModel(fault));
    }

    [HttpGet("vehicle/{vehicleId}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<IEnumerable<FaultListViewModel>>> GetByVehicleId(int vehicleId)
    {
        var faults = ApplyTenantScope(await _faultService.GetFaultsByVehicleIdAsync(vehicleId));
        return Ok(faults.Select(MapToListViewModel));
    }

    [HttpGet("status/{status}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<IEnumerable<FaultListViewModel>>> GetByStatus(string status)
    {
        var faults = ApplyTenantScope(await _faultService.GetFaultsByStatusAsync(status));
        return Ok(faults.Select(MapToListViewModel));
    }

    [HttpGet("severity/{severity}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<IEnumerable<FaultListViewModel>>> GetBySeverity(string severity)
    {
        var faults = ApplyTenantScope(await _faultService.GetFaultsBySeverityAsync(severity));
        return Ok(faults.Select(MapToListViewModel));
    }

    [HttpPost]
    [Authorize(Policy = "CanEdit")]
    public async Task<ActionResult<FaultDetailViewModel>> Report([FromBody] CreateFaultViewModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var tenantId = User.GetTenantId();
        if (tenantId is null && !User.IsSystemAdmin())
            return Forbid();

        var fault = new Fault
        {
            VehicleId = model.VehicleId,
            Title = model.Title,
            Description = model.Description,
            Severity = model.Severity,
            Status = model.Status,
            ReportedByUserId = model.ReportedByUserId,
            TenantId = tenantId ?? 0
        };

        var created = await _faultService.ReportFaultAsync(fault);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, MapToDetailViewModel(created));
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "CanEdit")]
    public async Task<ActionResult<FaultDetailViewModel>> Update(int id, [FromBody] UpdateFaultViewModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (id != model.Id)
            return BadRequest("ID mismatch");

        var existing = await _faultService.GetFaultByIdAsync(id);
        if (existing == null)
            return NotFound($"Fault with ID {id} not found");
        if (!CanAccessTenant(existing.TenantId))
            return Forbid();

        existing.VehicleId = model.VehicleId;
        existing.Title = model.Title;
        existing.Description = model.Description;
        existing.Severity = model.Severity;
        existing.Status = model.Status;
        existing.ResolvedDate = model.ResolvedDate;

        var updated = await _faultService.UpdateFaultAsync(existing);
        return Ok(MapToDetailViewModel(updated));
    }

    [HttpPost("{id}/convert-to-jobcard")]
    [Authorize(Policy = "CanEdit")]
    public async Task<ActionResult> ConvertToJobCard(int id, [FromBody] ConvertFaultToJobCardViewModel? model)
    {
        var source = await _faultService.GetFaultByIdAsync(id);
        if (source == null)
            return NotFound($"Fault with ID {id} not found");
        if (!CanAccessTenant(source.TenantId))
            return Forbid();

        try
        {
            var jobCard = await _jobCardService.ConvertFaultToJobCardAsync(
                id,
                model?.AssignedToUserId,
                model?.EstimatedCost ?? 0);

            return CreatedAtAction(nameof(GetById), new { id = jobCard.FaultId }, new
            {
                jobCardId = jobCard.Id,
                jobNumber = jobCard.JobNumber,
                faultId = id,
                vehicleId = jobCard.VehicleId,
                priority = jobCard.Priority,
                status = jobCard.Status
            });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ex.Message);
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "CanDelete")]
    public async Task<ActionResult> Delete(int id)
    {
        var existing = await _faultService.GetFaultByIdAsync(id);
        if (existing == null)
            return NotFound($"Fault with ID {id} not found");
        if (!CanAccessTenant(existing.TenantId))
            return Forbid();

        var result = await _faultService.DeleteFaultAsync(id);
        return result ? NoContent() : NotFound($"Fault with ID {id} not found");
    }

    // ----- Tenant isolation helpers -----

    private bool CanAccessTenant(int tenantId)
        => User.IsSystemAdmin() || User.GetTenantId() == tenantId;

    private IEnumerable<Fault> ApplyTenantScope(IEnumerable<Fault> faults)
    {
        if (User.IsSystemAdmin())
            return faults;
        var tenantId = User.GetTenantId();
        return tenantId is null ? Enumerable.Empty<Fault>() : faults.Where(f => f.TenantId == tenantId);
    }

    private static FaultListViewModel MapToListViewModel(Fault fault) => new()
    {
        Id = fault.Id,
        VehicleId = fault.VehicleId,
        VehicleRegistration = fault.Vehicle?.RegistrationNumber,
        Title = fault.Title,
        Severity = fault.Severity,
        Status = fault.Status,
        ReportedDate = fault.ReportedDate
    };

    private static FaultDetailViewModel MapToDetailViewModel(Fault fault) => new()
    {
        Id = fault.Id,
        VehicleId = fault.VehicleId,
        VehicleRegistration = fault.Vehicle?.RegistrationNumber,
        Title = fault.Title,
        Description = fault.Description,
        Severity = fault.Severity,
        Status = fault.Status,
        ReportedDate = fault.ReportedDate,
        ResolvedDate = fault.ResolvedDate,
        ReportedByUserId = fault.ReportedByUserId,
        CreatedAt = fault.CreatedAt,
        UpdatedAt = fault.UpdatedAt
    };
}
