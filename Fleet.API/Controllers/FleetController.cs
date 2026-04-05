using Fleet.API.ViewModels;
using Fleet.Core.Services;
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
    public async Task<ActionResult<IEnumerable<Core.Domain.Fleet>>> GetAllFleets()
    {
        var fleets = await _fleetService.GetAllFleetsAsync();
        return Ok(fleets);
    }

    [HttpGet("{id}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<Core.Domain.Fleet>> GetFleetById(int id)
    {
        var fleet = await _fleetService.GetFleetByIdAsync(id);
        return fleet == null ? NotFound($"Fleet with ID {id} not found") : Ok(fleet);
    }

    [HttpGet("tenant/{tenantId}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<IEnumerable<Core.Domain.Fleet>>> GetFleetsByTenantId(int tenantId)
    {
        var fleets = await _fleetService.GetFleetsByTenantIdAsync(tenantId);
        return Ok(fleets);
    }

    [HttpGet("active")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<IEnumerable<Core.Domain.Fleet>>> GetActiveFleets()
    {
        var fleets = await _fleetService.GetActiveFleetsAsync();
        return Ok(fleets);
    }

    [HttpPost]
    [Authorize(Policy = "RequireManager")]
    public async Task<ActionResult<Core.Domain.Fleet>> CreateFleet([FromBody] CreateFleetViewModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var fleet = new Core.Domain.Fleet
        {
            TenantId = model.TenantId,
            Name = model.Name,
            Description = model.Description,
            Location = model.Location,
            IsActive = model.IsActive
        };

        var createdFleet = await _fleetService.CreateFleetAsync(fleet);
        return CreatedAtAction(nameof(GetFleetById), new { id = createdFleet.Id }, createdFleet);
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "RequireManager")]
    public async Task<ActionResult<Core.Domain.Fleet>> UpdateFleet(int id, [FromBody] UpdateFleetViewModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (id != model.Id)
            return BadRequest("ID mismatch");

        var existingFleet = await _fleetService.GetFleetByIdAsync(id);
        if (existingFleet == null)
            return NotFound($"Fleet with ID {id} not found");

        var fleet = new Core.Domain.Fleet
        {
            Id = model.Id,
            TenantId = model.TenantId,
            Name = model.Name,
            Description = model.Description,
            Location = model.Location,
            IsActive = model.IsActive
        };

        var updatedFleet = await _fleetService.UpdateFleetAsync(fleet);
        return Ok(updatedFleet);
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "CanDelete")]
    public async Task<ActionResult> DeleteFleet(int id)
    {
        var result = await _fleetService.DeleteFleetAsync(id);
        return result ? NoContent() : NotFound($"Fleet with ID {id} not found");
    }
}
