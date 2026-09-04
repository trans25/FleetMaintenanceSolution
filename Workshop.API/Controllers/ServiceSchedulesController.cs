using Fleet.Core.Domain;
using Fleet.Core.Services;
using Fleet.Core.ViewModels.ServiceSchedules;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Workshop.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ServiceSchedulesController : ControllerBase
{
    private readonly IServiceScheduleService _scheduleService;

    public ServiceSchedulesController(IServiceScheduleService scheduleService)
    {
        _scheduleService = scheduleService;
    }

    [HttpGet]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<IEnumerable<ServiceScheduleListViewModel>>> GetAll()
    {
        var schedules = await _scheduleService.GetAllSchedulesAsync();
        return Ok(schedules.Select(MapToListViewModel));
    }

    [HttpGet("{id}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<ServiceScheduleDetailViewModel>> GetById(int id)
    {
        var schedule = await _scheduleService.GetScheduleByIdAsync(id);
        return schedule == null
            ? NotFound($"Service schedule with ID {id} not found")
            : Ok(MapToDetailViewModel(schedule));
    }

    [HttpGet("vehicle/{vehicleId}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<IEnumerable<ServiceScheduleListViewModel>>> GetByVehicleId(int vehicleId)
    {
        var schedules = await _scheduleService.GetSchedulesByVehicleIdAsync(vehicleId);
        return Ok(schedules.Select(MapToListViewModel));
    }

    [HttpGet("upcoming")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<IEnumerable<ServiceScheduleListViewModel>>> GetUpcoming()
    {
        var schedules = await _scheduleService.GetUpcomingSchedulesAsync(DateTime.UtcNow);
        return Ok(schedules.Select(MapToListViewModel));
    }

    [HttpGet("overdue")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<IEnumerable<ServiceScheduleListViewModel>>> GetOverdue()
    {
        var schedules = await _scheduleService.GetOverdueSchedulesAsync(DateTime.UtcNow);
        return Ok(schedules.Select(MapToListViewModel));
    }

    [HttpPost]
    [Authorize(Policy = "RequireManager")]
    public async Task<ActionResult<ServiceScheduleDetailViewModel>> Create([FromBody] CreateServiceScheduleViewModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var schedule = new ServiceSchedule
        {
            VehicleId = model.VehicleId,
            ServiceType = model.ServiceType,
            Description = model.Description,
            ScheduledDate = model.ScheduledDate,
            MileageAtService = model.MileageAtService,
            Status = model.Status,
            Notes = model.Notes
        };

        var created = await _scheduleService.CreateScheduleAsync(schedule);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, MapToDetailViewModel(created));
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "CanEdit")]
    public async Task<ActionResult<ServiceScheduleDetailViewModel>> Update(int id, [FromBody] UpdateServiceScheduleViewModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (id != model.Id)
            return BadRequest("ID mismatch");

        var existing = await _scheduleService.GetScheduleByIdAsync(id);
        if (existing == null)
            return NotFound($"Service schedule with ID {id} not found");

        existing.VehicleId = model.VehicleId;
        existing.ServiceType = model.ServiceType;
        existing.Description = model.Description;
        existing.ScheduledDate = model.ScheduledDate;
        existing.CompletedDate = model.CompletedDate;
        existing.MileageAtService = model.MileageAtService;
        existing.Status = model.Status;
        existing.Notes = model.Notes;

        var updated = await _scheduleService.UpdateScheduleAsync(existing);
        return Ok(MapToDetailViewModel(updated));
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "CanDelete")]
    public async Task<ActionResult> Delete(int id)
    {
        var result = await _scheduleService.DeleteScheduleAsync(id);
        return result ? NoContent() : NotFound($"Service schedule with ID {id} not found");
    }

    private static ServiceScheduleListViewModel MapToListViewModel(ServiceSchedule schedule) => new()
    {
        Id = schedule.Id,
        VehicleId = schedule.VehicleId,
        VehicleRegistration = schedule.Vehicle?.RegistrationNumber,
        ServiceType = schedule.ServiceType,
        ScheduledDate = schedule.ScheduledDate,
        CompletedDate = schedule.CompletedDate,
        Status = schedule.Status
    };

    private static ServiceScheduleDetailViewModel MapToDetailViewModel(ServiceSchedule schedule) => new()
    {
        Id = schedule.Id,
        VehicleId = schedule.VehicleId,
        VehicleRegistration = schedule.Vehicle?.RegistrationNumber,
        ServiceType = schedule.ServiceType,
        Description = schedule.Description,
        ScheduledDate = schedule.ScheduledDate,
        CompletedDate = schedule.CompletedDate,
        MileageAtService = schedule.MileageAtService,
        Status = schedule.Status,
        Notes = schedule.Notes,
        CreatedAt = schedule.CreatedAt,
        UpdatedAt = schedule.UpdatedAt
    };
}
