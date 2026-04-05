using Fleet.Core.Domain;
using Fleet.Core.Services;
using Maintenance.API.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Maintenance.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class JobCardController : ControllerBase
{
    private readonly IJobCardService _jobCardService;

    public JobCardController(IJobCardService jobCardService)
    {
        _jobCardService = jobCardService;
    }

    [HttpGet]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<IEnumerable<JobCard>>> GetAllJobCards()
    {
        var jobCards = await _jobCardService.GetAllJobCardsAsync();
        return Ok(jobCards);
    }

    [HttpGet("{id}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<JobCard>> GetJobCardById(int id)
    {
        var jobCard = await _jobCardService.GetJobCardByIdAsync(id);
        return jobCard == null ? NotFound($"Job card with ID {id} not found") : Ok(jobCard);
    }

    [HttpGet("job/{jobNumber}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<JobCard>> GetJobCardByJobNumber(string jobNumber)
    {
        var jobCard = await _jobCardService.GetJobCardByJobNumberAsync(jobNumber);
        return jobCard == null ? NotFound($"Job card with job number {jobNumber} not found") : Ok(jobCard);
    }

    [HttpGet("vehicle/{vehicleId}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<IEnumerable<JobCard>>> GetJobCardsByVehicleId(int vehicleId)
    {
        var jobCards = await _jobCardService.GetJobCardsByVehicleIdAsync(vehicleId);
        return Ok(jobCards);
    }

    [HttpGet("assigned/{userId}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<IEnumerable<JobCard>>> GetJobCardsAssignedToUser(int userId)
    {
        var jobCards = await _jobCardService.GetJobCardsByAssignedUserAsync(userId);
        return Ok(jobCards);
    }

    [HttpGet("status/{status}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<IEnumerable<JobCard>>> GetJobCardsByStatus(string status)
    {
        var jobCards = await _jobCardService.GetJobCardsByStatusAsync(status);
        return Ok(jobCards);
    }

    [HttpGet("open")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<IEnumerable<JobCard>>> GetOpenJobCards()
    {
        var jobCards = await _jobCardService.GetOpenJobCardsAsync();
        return Ok(jobCards);
    }

    [HttpPost]
    [Authorize(Policy = "RequireManager")]
    public async Task<ActionResult<JobCard>> CreateJobCard([FromBody] CreateJobCardViewModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var jobCard = new JobCard
        {
            TenantId = model.TenantId,
            JobNumber = model.JobNumber,
            VehicleId = model.VehicleId,
            Description = model.Description,
            Status = model.Status,
            Priority = model.Priority,
            AssignedToUserId = model.AssignedToUserId,
            EstimatedCost = model.EstimatedCost,
            ActualCost = model.ActualCost
        };

        var createdJobCard = await _jobCardService.CreateJobCardAsync(jobCard);
        return CreatedAtAction(nameof(GetJobCardById), new { id = createdJobCard.Id }, createdJobCard);
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "CanEdit")]
    public async Task<ActionResult<JobCard>> UpdateJobCard(int id, [FromBody] UpdateJobCardViewModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (id != model.Id)
            return BadRequest("ID mismatch");

        var existingJobCard = await _jobCardService.GetJobCardByIdAsync(id);
        if (existingJobCard == null)
            return NotFound($"Job card with ID {id} not found");

        var jobCard = new JobCard
        {
            Id = model.Id,
            TenantId = model.TenantId,
            JobNumber = model.JobNumber,
            VehicleId = model.VehicleId,
            Description = model.Description,
            Status = model.Status,
            Priority = model.Priority,
            AssignedToUserId = model.AssignedToUserId,
            EstimatedCost = model.EstimatedCost,
            ActualCost = model.ActualCost
        };

        var updatedJobCard = await _jobCardService.UpdateJobCardAsync(jobCard);
        return Ok(updatedJobCard);
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "CanDelete")]
    public async Task<ActionResult> DeleteJobCard(int id)
    {
        var result = await _jobCardService.DeleteJobCardAsync(id);
        return result ? NoContent() : NotFound($"Job card with ID {id} not found");
    }

    // JobCardTask endpoints

    [HttpGet("{jobCardId}/tasks")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<IEnumerable<JobCardTask>>> GetTasksByJobCardId(int jobCardId)
    {
        var tasks = await _jobCardService.GetTasksByJobCardIdAsync(jobCardId);
        return Ok(tasks);
    }

    [HttpPost("{jobCardId}/tasks")]
    [Authorize(Policy = "RequireManager")]
    public async Task<ActionResult<JobCardTask>> AddTaskToJobCard(int jobCardId, [FromBody] JobCardTask task)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var createdTask = await _jobCardService.AddTaskToJobCardAsync(jobCardId, task);
        return Ok(createdTask);
    }

    [HttpPut("tasks/{taskId}")]
    [Authorize(Policy = "CanEdit")]
    public async Task<ActionResult<JobCardTask>> UpdateTask(int taskId, [FromBody] JobCardTask task)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (taskId != task.Id)
            return BadRequest("ID mismatch");

        var updatedTask = await _jobCardService.UpdateTaskAsync(task);
        return Ok(updatedTask);
    }
}
