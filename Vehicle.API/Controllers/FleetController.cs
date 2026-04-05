using Fleet.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Vehicle.API.Controllers;

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
    public async Task<ActionResult<IEnumerable<Fleet.Core.Domain.Fleet>>> GetAllFleets()
    {
        var fleets = await _fleetService.GetAllFleetsAsync();
        return Ok(fleets);
    }

    [HttpGet("{id}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<Fleet.Core.Domain.Fleet>> GetFleetById(int id)
    {
        var fleet = await _fleetService.GetFleetByIdAsync(id);
        return fleet == null ? NotFound($"Fleet with ID {id} not found") : Ok(fleet);
    }

    [HttpGet("tenant/{tenantId}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<IEnumerable<Fleet.Core.Domain.Fleet>>> GetFleetsByTenantId(int tenantId)
    {
        var fleets = await _fleetService.GetFleetsByTenantIdAsync(tenantId);
        return Ok(fleets);
    }

    [HttpGet("active")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<IEnumerable<Fleet.Core.Domain.Fleet>>> GetActiveFleets()
    {
        var fleets = await _fleetService.GetActiveFleetsAsync();
        return Ok(fleets);
    }

    [HttpPost]
    [Authorize(Policy = "RequireManager")]
    public async Task<ActionResult<Fleet.Core.Domain.Fleet>> CreateFleet([FromBody] Fleet.Core.Domain.Fleet fleet)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var createdFleet = await _fleetService.CreateFleetAsync(fleet);
        return CreatedAtAction(nameof(GetFleetById), new { id = createdFleet.Id }, createdFleet);
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "RequireManager")]
    public async Task<ActionResult<Fleet.Core.Domain.Fleet>> UpdateFleet(int id, [FromBody] Fleet.Core.Domain.Fleet fleet)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (id != fleet.Id)
            return BadRequest("ID mismatch");

        var existingFleet = await _fleetService.GetFleetByIdAsync(id);
        if (existingFleet == null)
            return NotFound($"Fleet with ID {id} not found");

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

