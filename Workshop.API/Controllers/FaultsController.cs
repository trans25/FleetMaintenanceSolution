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

    public FaultsController(IFaultService faultService)
    {
        _faultService = faultService;
    }

    [HttpGet]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<IEnumerable<FaultListViewModel>>> GetAll()
    {
        var faults = await _faultService.GetAllFaultsAsync();
        return Ok(faults.Select(MapToListViewModel));
    }

    [HttpGet("{id}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<FaultDetailViewModel>> GetById(int id)
    {
        var fault = await _faultService.GetFaultByIdAsync(id);
        return fault == null
            ? NotFound($"Fault with ID {id} not found")
            : Ok(MapToDetailViewModel(fault));
    }

    [HttpGet("vehicle/{vehicleId}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<IEnumerable<FaultListViewModel>>> GetByVehicleId(int vehicleId)
    {
        var faults = await _faultService.GetFaultsByVehicleIdAsync(vehicleId);
        return Ok(faults.Select(MapToListViewModel));
    }

    [HttpGet("status/{status}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<IEnumerable<FaultListViewModel>>> GetByStatus(string status)
    {
        var faults = await _faultService.GetFaultsByStatusAsync(status);
        return Ok(faults.Select(MapToListViewModel));
    }

    [HttpGet("severity/{severity}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<IEnumerable<FaultListViewModel>>> GetBySeverity(string severity)
    {
        var faults = await _faultService.GetFaultsBySeverityAsync(severity);
        return Ok(faults.Select(MapToListViewModel));
    }

    [HttpPost]
    [Authorize(Policy = "CanEdit")]
    public async Task<ActionResult<FaultDetailViewModel>> Report([FromBody] CreateFaultViewModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var fault = new Fault
        {
            VehicleId = model.VehicleId,
            Title = model.Title,
            Description = model.Description,
            Severity = model.Severity,
            Status = model.Status,
            ReportedByUserId = model.ReportedByUserId
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

        existing.VehicleId = model.VehicleId;
        existing.Title = model.Title;
        existing.Description = model.Description;
        existing.Severity = model.Severity;
        existing.Status = model.Status;
        existing.ResolvedDate = model.ResolvedDate;

        var updated = await _faultService.UpdateFaultAsync(existing);
        return Ok(MapToDetailViewModel(updated));
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "CanDelete")]
    public async Task<ActionResult> Delete(int id)
    {
        var result = await _faultService.DeleteFaultAsync(id);
        return result ? NoContent() : NotFound($"Fault with ID {id} not found");
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
