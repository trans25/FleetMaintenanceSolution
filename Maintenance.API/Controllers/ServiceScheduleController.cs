using Fleet.Core.Domain;
using Fleet.Core.Services;
using Maintenance.API.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Maintenance.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ServiceScheduleController : ControllerBase
{
    private readonly IServiceScheduleService _scheduleService;

    public ServiceScheduleController(IServiceScheduleService scheduleService)
    {
        _scheduleService = scheduleService;
    }

    [HttpGet]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<IEnumerable<ServiceSchedule>>> GetAllSchedules()
    {
        var schedules = await _scheduleService.GetAllSchedulesAsync();
        return Ok(schedules);
    }

    [HttpGet("{id}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<ServiceSchedule>> GetScheduleById(int id)
    {
        var schedule = await _scheduleService.GetScheduleByIdAsync(id);
        return schedule == null ? NotFound($"Service schedule with ID {id} not found") : Ok(schedule);
    }

    [HttpGet("vehicle/{vehicleId}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<IEnumerable<ServiceSchedule>>> GetSchedulesByVehicleId(int vehicleId)
    {
        var schedules = await _scheduleService.GetSchedulesByVehicleIdAsync(vehicleId);
        return Ok(schedules);
    }

    [HttpGet("upcoming")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<IEnumerable<ServiceSchedule>>> GetUpcomingSchedules()
    {
        var schedules = await _scheduleService.GetUpcomingSchedulesAsync(DateTime.UtcNow.AddDays(30));
        return Ok(schedules);
    }

    [HttpGet("overdue")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<IEnumerable<ServiceSchedule>>> GetOverdueSchedules()
    {
        var schedules = await _scheduleService.GetOverdueSchedulesAsync(DateTime.UtcNow);
        return Ok(schedules);
    }

    [HttpPost]
    [Authorize(Policy = "RequireManager")]
    public async Task<ActionResult<ServiceSchedule>> CreateSchedule([FromBody] CreateServiceScheduleViewModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var schedule = new ServiceSchedule
        {
            TenantId = model.TenantId,
            VehicleId = model.VehicleId,
            ServiceType = model.ServiceType,
            ScheduledDate = model.ScheduledDate,
            MileageAtService = model.MileageAtService,
            Description = model.Description,
            Status = model.Status
        };

        var createdSchedule = await _scheduleService.CreateScheduleAsync(schedule);
        return CreatedAtAction(nameof(GetScheduleById), new { id = createdSchedule.Id }, createdSchedule);
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "CanEdit")]
    public async Task<ActionResult<ServiceSchedule>> UpdateSchedule(int id, [FromBody] UpdateServiceScheduleViewModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (id != model.Id)
            return BadRequest("ID mismatch");

        var existingSchedule = await _scheduleService.GetScheduleByIdAsync(id);
        if (existingSchedule == null)
            return NotFound($"Service schedule with ID {id} not found");

        var schedule = new ServiceSchedule
        {
            Id = model.Id,
            TenantId = model.TenantId,
            VehicleId = model.VehicleId,
            ServiceType = model.ServiceType,
            ScheduledDate = model.ScheduledDate,
            MileageAtService = model.MileageAtService,
            Description = model.Description,
            Status = model.Status
        };

        var updatedSchedule = await _scheduleService.UpdateScheduleAsync(schedule);
        return Ok(updatedSchedule);
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "CanDelete")]
    public async Task<ActionResult> DeleteSchedule(int id)
    {
        var result = await _scheduleService.DeleteScheduleAsync(id);
        return result ? NoContent() : NotFound($"Service schedule with ID {id} not found");
    }
}
