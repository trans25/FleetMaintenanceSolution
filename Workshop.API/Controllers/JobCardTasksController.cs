using Fleet.Core.Domain;
using Fleet.Core.Services;
using Fleet.Core.ViewModels.JobCardTasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Workshop.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class JobCardTasksController : ControllerBase
{
    private readonly IJobCardTaskService _jobCardTaskService;

    public JobCardTasksController(IJobCardTaskService jobCardTaskService)
    {
        _jobCardTaskService = jobCardTaskService;
    }

    [HttpGet("jobcard/{jobCardId}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<IEnumerable<JobCardTaskListViewModel>>> GetByJobCardId(int jobCardId)
    {
        var tasks = await _jobCardTaskService.GetTasksByJobCardIdAsync(jobCardId);
        return Ok(tasks.Select(MapToListViewModel));
    }

    [HttpGet("{id}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<JobCardTaskDetailViewModel>> GetById(int id)
    {
        var task = await _jobCardTaskService.GetTaskByIdAsync(id);
        return task == null
            ? NotFound($"Task with ID {id} not found")
            : Ok(MapToDetailViewModel(task));
    }

    [HttpPost]
    [Authorize(Policy = "RequireManager")]
    public async Task<ActionResult<JobCardTaskDetailViewModel>> Create([FromBody] CreateJobCardTaskViewModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var task = new JobCardTask
        {
            JobCardId = model.JobCardId,
            TaskName = model.TaskName,
            Description = model.Description,
            IsCompleted = model.IsCompleted,
            Notes = model.Notes
        };

        var created = await _jobCardTaskService.CreateTaskAsync(task);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, MapToDetailViewModel(created));
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "CanEdit")]
    public async Task<ActionResult<JobCardTaskDetailViewModel>> Update(int id, [FromBody] UpdateJobCardTaskViewModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (id != model.Id)
            return BadRequest("ID mismatch");

        var existing = await _jobCardTaskService.GetTaskByIdAsync(id);
        if (existing == null)
            return NotFound($"Task with ID {id} not found");

        existing.JobCardId = model.JobCardId;
        existing.TaskName = model.TaskName;
        existing.Description = model.Description;
        existing.IsCompleted = model.IsCompleted;
        existing.CompletedDate = model.CompletedDate;
        existing.CompletedByUserId = model.CompletedByUserId;
        existing.Notes = model.Notes;

        var updated = await _jobCardTaskService.UpdateTaskAsync(existing);
        return Ok(MapToDetailViewModel(updated));
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "CanDelete")]
    public async Task<ActionResult> Delete(int id)
    {
        var result = await _jobCardTaskService.DeleteTaskAsync(id);
        return result ? NoContent() : NotFound($"Task with ID {id} not found");
    }

    private static JobCardTaskListViewModel MapToListViewModel(JobCardTask task) => new()
    {
        Id = task.Id,
        JobCardId = task.JobCardId,
        TaskName = task.TaskName,
        IsCompleted = task.IsCompleted,
        CompletedDate = task.CompletedDate
    };

    private static JobCardTaskDetailViewModel MapToDetailViewModel(JobCardTask task) => new()
    {
        Id = task.Id,
        JobCardId = task.JobCardId,
        TaskName = task.TaskName,
        Description = task.Description,
        IsCompleted = task.IsCompleted,
        CompletedDate = task.CompletedDate,
        CompletedByUserId = task.CompletedByUserId,
        Notes = task.Notes,
        CreatedAt = task.CreatedAt,
        UpdatedAt = task.UpdatedAt
    };
}
