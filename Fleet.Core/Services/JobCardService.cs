using Fleet.Core.Domain;
using Fleet.Core.Interfaces;

namespace Fleet.Core.Services;

public class JobCardService : IJobCardService
{
    private readonly IJobCardRepository _jobCardRepository;
    private readonly IJobCardTaskRepository _jobCardTaskRepository;

    public JobCardService(
        IJobCardRepository jobCardRepository,
        IJobCardTaskRepository jobCardTaskRepository)
    {
        _jobCardRepository = jobCardRepository;
        _jobCardTaskRepository = jobCardTaskRepository;
    }

    public async Task<IEnumerable<JobCard>> GetAllJobCardsAsync()
    {
        return await _jobCardRepository.GetAllAsync();
    }

    public async Task<JobCard?> GetJobCardByIdAsync(int id)
    {
        return await _jobCardRepository.GetByIdAsync(id);
    }

    public async Task<JobCard?> GetJobCardByJobNumberAsync(string jobNumber)
    {
        return await _jobCardRepository.GetByJobNumberAsync(jobNumber);
    }

    public async Task<IEnumerable<JobCard>> GetJobCardsByVehicleIdAsync(int vehicleId)
    {
        return await _jobCardRepository.GetJobCardsByVehicleIdAsync(vehicleId);
    }

    public async Task<IEnumerable<JobCard>> GetJobCardsByAssignedUserAsync(int userId)
    {
        return await _jobCardRepository.GetJobCardsByAssignedUserAsync(userId);
    }

    public async Task<IEnumerable<JobCard>> GetJobCardsByStatusAsync(string status)
    {
        return await _jobCardRepository.GetJobCardsByStatusAsync(status);
    }

    public async Task<IEnumerable<JobCard>> GetOpenJobCardsAsync()
    {
        var allJobCards = await _jobCardRepository.GetAllAsync();
        return allJobCards.Where(jc => 
            jc.Status != "Completed" && 
            jc.Status != "Cancelled" &&
            jc.CompletedDate == null
        ).ToList();
    }

    public async Task<JobCard> CreateJobCardAsync(JobCard jobCard)
    {
        jobCard.CreatedAt = DateTime.UtcNow;
        jobCard.Status = "Pending";
        
        // Generate job number if not provided
        if (string.IsNullOrEmpty(jobCard.JobNumber))
        {
            jobCard.JobNumber = $"JOB-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}";
        }

        return await _jobCardRepository.AddAsync(jobCard);
    }

    public async Task<JobCard> UpdateJobCardAsync(JobCard jobCard)
    {
        jobCard.UpdatedAt = DateTime.UtcNow;
        
        // If marking as completed, set the completed date
        if (jobCard.Status == "Completed" && jobCard.CompletedDate == null)
        {
            jobCard.CompletedDate = DateTime.UtcNow;
        }

        return await _jobCardRepository.UpdateAsync(jobCard);
    }

    public async Task<bool> DeleteJobCardAsync(int id)
    {
        return await _jobCardRepository.DeleteAsync(id);
    }

    // JobCardTask methods

    public async Task<IEnumerable<JobCardTask>> GetTasksByJobCardIdAsync(int jobCardId)
    {
        return await _jobCardTaskRepository.GetTasksByJobCardIdAsync(jobCardId);
    }

    public async Task<JobCardTask> AddTaskToJobCardAsync(int jobCardId, JobCardTask task)
    {
        task.JobCardId = jobCardId;
        task.CreatedAt = DateTime.UtcNow;
        return await _jobCardTaskRepository.AddAsync(task);
    }

    public async Task<JobCardTask> UpdateTaskAsync(JobCardTask task)
    {
        // If marking as completed, set the completed date
        if (task.IsCompleted && task.CompletedDate == null)
        {
            task.CompletedDate = DateTime.UtcNow;
        }

        return await _jobCardTaskRepository.UpdateAsync(task);
    }
}
