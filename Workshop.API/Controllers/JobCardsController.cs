using Fleet.Core.Common;
using Fleet.Core.Domain;
using Fleet.Core.Services;
using Fleet.Core.ViewModels.JobCards;
using Fleet.Core.ViewModels.JobCardTasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Workshop.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class JobCardsController : ControllerBase
{
    private readonly IJobCardService _jobCardService;

    public JobCardsController(IJobCardService jobCardService)
    {
        _jobCardService = jobCardService;
    }

    [HttpGet]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<PagedResult<JobCardListViewModel>>> GetAll([FromQuery] JobCardQuery query)
    {
        IEnumerable<JobCard> jobCards = await _jobCardService.GetAllJobCardsAsync();
        jobCards = ApplyTenantScope(jobCards);

        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            jobCards = jobCards.Where(j =>
                string.Equals(j.Status, query.Status, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(query.Priority))
        {
            jobCards = jobCards.Where(j =>
                string.Equals(j.Priority, query.Priority, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim();
            jobCards = jobCards.Where(j =>
                (j.JobNumber?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false) ||
                (j.Title?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false) ||
                (j.Description?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false) ||
                (j.Vehicle?.RegistrationNumber?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false));
        }

        var vms = jobCards
            .OrderByDescending(j => j.CreatedDate)
            .Select(MapToListViewModel);
        return Ok(PagedResult<JobCardListViewModel>.Create(vms, query.Page, query.PageSize));
    }

    [HttpGet("{id}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<JobCardDetailViewModel>> GetById(int id)
    {
        var jobCard = await _jobCardService.GetJobCardByIdAsync(id);
        if (jobCard == null)
            return NotFound($"Job card with ID {id} not found");
        if (!CanAccessTenant(jobCard.TenantId))
            return Forbid();
        return Ok(MapToDetailViewModel(jobCard));
    }

    [HttpGet("status/{status}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<IEnumerable<JobCardListViewModel>>> GetByStatus(string status)
    {
        var jobCards = ApplyTenantScope(await _jobCardService.GetJobCardsByStatusAsync(status));
        return Ok(jobCards.Select(MapToListViewModel));
    }

    [HttpPost]
    [Authorize(Policy = "RequireManager")]
    public async Task<ActionResult<JobCardDetailViewModel>> Create([FromBody] CreateJobCardViewModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var tenantId = User.GetTenantId();
        if (tenantId is null && !User.IsSystemAdmin())
            return Forbid();

        var jobCard = new JobCard
        {
            VehicleId = model.VehicleId,
            FaultId = model.FaultId,
            JobNumber = model.JobNumber,
            Title = model.Title,
            Description = model.Description,
            Priority = model.Priority,
            Status = model.Status,
            AssignedToUserId = model.AssignedToUserId,
            EstimatedCost = model.EstimatedCost,
            TenantId = tenantId ?? 0
        };

        var created = await _jobCardService.CreateJobCardAsync(jobCard);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, MapToDetailViewModel(created));
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "CanEdit")]
    public async Task<ActionResult<JobCardDetailViewModel>> Update(int id, [FromBody] UpdateJobCardViewModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (id != model.Id)
            return BadRequest("ID mismatch");

        var existing = await _jobCardService.GetJobCardByIdAsync(id);
        if (existing == null)
            return NotFound($"Job card with ID {id} not found");
        if (!CanAccessTenant(existing.TenantId))
            return Forbid();

        existing.VehicleId = model.VehicleId;
        existing.FaultId = model.FaultId;
        existing.JobNumber = model.JobNumber;
        existing.Title = model.Title;
        existing.Description = model.Description;
        existing.Priority = model.Priority;
        existing.Status = model.Status;
        existing.AssignedToUserId = model.AssignedToUserId;
        existing.StartDate = model.StartDate;
        existing.CompletedDate = model.CompletedDate;
        existing.EstimatedCost = model.EstimatedCost;
        existing.ActualCost = model.ActualCost;

        var updated = await _jobCardService.UpdateJobCardAsync(existing);
        return Ok(MapToDetailViewModel(updated));
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "CanDelete")]
    public async Task<ActionResult> Delete(int id)
    {
        var existing = await _jobCardService.GetJobCardByIdAsync(id);
        if (existing == null)
            return NotFound($"Job card with ID {id} not found");
        if (!CanAccessTenant(existing.TenantId))
            return Forbid();

        var result = await _jobCardService.DeleteJobCardAsync(id);
        return result ? NoContent() : NotFound($"Job card with ID {id} not found");
    }

    // Workflow (real-life maintenance lifecycle) endpoints

    [HttpPost("{id}/start")]
    [Authorize(Policy = "CanEdit")]
    public async Task<ActionResult<JobCardDetailViewModel>> Start(int id, [FromBody] StartJobCardViewModel? model)
    {
        if (!await CanAccessJobCard(id))
            return Forbid();
        var updated = await _jobCardService.StartJobCardAsync(id, model?.AssignedToUserId);
        return Ok(MapToDetailViewModel(updated));
    }

    [HttpPost("{id}/complete")]
    [Authorize(Policy = "CanEdit")]
    public async Task<ActionResult<JobCardDetailViewModel>> Complete(int id, [FromBody] CompleteJobCardViewModel? model)
    {
        if (!await CanAccessJobCard(id))
            return Forbid();
        var updated = await _jobCardService.CompleteJobCardAsync(id, model?.ActualCost);
        return Ok(MapToDetailViewModel(updated));
    }

    [HttpPost("{id}/cancel")]
    [Authorize(Policy = "CanEdit")]
    public async Task<ActionResult<JobCardDetailViewModel>> Cancel(int id)
    {
        if (!await CanAccessJobCard(id))
            return Forbid();
        var updated = await _jobCardService.CancelJobCardAsync(id);
        return Ok(MapToDetailViewModel(updated));
    }

    // ----- Tenant isolation helpers -----

    private bool CanAccessTenant(int tenantId)
        => User.IsSystemAdmin() || User.GetTenantId() == tenantId;

    private IEnumerable<JobCard> ApplyTenantScope(IEnumerable<JobCard> jobCards)
    {
        if (User.IsSystemAdmin())
            return jobCards;
        var tenantId = User.GetTenantId();
        return tenantId is null ? Enumerable.Empty<JobCard>() : jobCards.Where(j => j.TenantId == tenantId);
    }

    private async Task<bool> CanAccessJobCard(int id)
    {
        var jobCard = await _jobCardService.GetJobCardByIdAsync(id);
        return jobCard != null && CanAccessTenant(jobCard.TenantId);
    }

    private static JobCardListViewModel MapToListViewModel(JobCard jobCard) => new()
    {
        Id = jobCard.Id,
        JobNumber = jobCard.JobNumber,
        Title = jobCard.Title,
        Priority = jobCard.Priority,
        Status = jobCard.Status,
        VehicleId = jobCard.VehicleId,
        VehicleRegistration = jobCard.Vehicle?.RegistrationNumber,
        AssignedToName = jobCard.AssignedTo == null
            ? null
            : $"{jobCard.AssignedTo.FirstName} {jobCard.AssignedTo.LastName}",
        CreatedDate = jobCard.CreatedDate
    };

    private static JobCardDetailViewModel MapToDetailViewModel(JobCard jobCard) => new()
    {
        Id = jobCard.Id,
        VehicleId = jobCard.VehicleId,
        VehicleRegistration = jobCard.Vehicle?.RegistrationNumber,
        FaultId = jobCard.FaultId,
        JobNumber = jobCard.JobNumber,
        Title = jobCard.Title,
        Description = jobCard.Description,
        Priority = jobCard.Priority,
        Status = jobCard.Status,
        AssignedToUserId = jobCard.AssignedToUserId,
        AssignedToName = jobCard.AssignedTo == null
            ? null
            : $"{jobCard.AssignedTo.FirstName} {jobCard.AssignedTo.LastName}",
        CreatedDate = jobCard.CreatedDate,
        StartDate = jobCard.StartDate,
        CompletedDate = jobCard.CompletedDate,
        EstimatedCost = jobCard.EstimatedCost,
        ActualCost = jobCard.ActualCost,
        CreatedAt = jobCard.CreatedAt,
        UpdatedAt = jobCard.UpdatedAt,
        Tasks = jobCard.Tasks?.Select(t => new JobCardTaskListViewModel
        {
            Id = t.Id,
            JobCardId = t.JobCardId,
            TaskName = t.TaskName,
            IsCompleted = t.IsCompleted,
            CompletedDate = t.CompletedDate
        }).ToList() ?? new List<JobCardTaskListViewModel>()
    };
}
