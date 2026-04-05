using Fleet.Core.Domain;
using Fleet.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Vehicle.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FaultController : ControllerBase
{
    private readonly IFaultService _faultService;

    public FaultController(IFaultService faultService)
    {
        _faultService = faultService;
    }

    [HttpGet]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<IEnumerable<Fault>>> GetAllFaults()
    {
        var faults = await _faultService.GetAllFaultsAsync();
        return Ok(faults);
    }

    [HttpGet("{id}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<Fault>> GetFaultById(int id)
    {
        var fault = await _faultService.GetFaultByIdAsync(id);
        return fault == null ? NotFound($"Fault with ID {id} not found") : Ok(fault);
    }

    [HttpGet("vehicle/{vehicleId}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<IEnumerable<Fault>>> GetFaultsByVehicleId(int vehicleId)
    {
        var faults = await _faultService.GetFaultsByVehicleIdAsync(vehicleId);
        return Ok(faults);
    }

    [HttpGet("status/{status}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<IEnumerable<Fault>>> GetFaultsByStatus(string status)
    {
        var faults = await _faultService.GetFaultsByStatusAsync(status);
        return Ok(faults);
    }

    [HttpGet("severity/{severity}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<IEnumerable<Fault>>> GetFaultsBySeverity(string severity)
    {
        var faults = await _faultService.GetFaultsBySeverityAsync(severity);
        return Ok(faults);
    }

    [HttpGet("open")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<IEnumerable<Fault>>> GetOpenFaults()
    {
        var faults = await _faultService.GetOpenFaultsAsync();
        return Ok(faults);
    }

    [HttpPost]
    [Authorize(Policy = "CanAdd")]
    public async Task<ActionResult<Fault>> ReportFault([FromBody] Fault fault)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var createdFault = await _faultService.ReportFaultAsync(fault);
        return CreatedAtAction(nameof(GetFaultById), new { id = createdFault.Id }, createdFault);
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "CanEdit")]
    public async Task<ActionResult<Fault>> UpdateFault(int id, [FromBody] Fault fault)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (id != fault.Id)
            return BadRequest("ID mismatch");

        var existingFault = await _faultService.GetFaultByIdAsync(id);
        if (existingFault == null)
            return NotFound($"Fault with ID {id} not found");

        var updatedFault = await _faultService.UpdateFaultAsync(fault);
        return Ok(updatedFault);
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "CanDelete")]
    public async Task<ActionResult> DeleteFault(int id)
    {
        var result = await _faultService.DeleteFaultAsync(id);
        return result ? NoContent() : NotFound($"Fault with ID {id} not found");
    }
}
