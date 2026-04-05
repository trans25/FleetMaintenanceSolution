using Fleet.Core.Domain;

namespace Fleet.Core.Services;

public interface IJobCardService
{
    Task<IEnumerable<JobCard>> GetAllJobCardsAsync();
    Task<JobCard?> GetJobCardByIdAsync(int id);
    Task<JobCard?> GetJobCardByJobNumberAsync(string jobNumber);
    Task<IEnumerable<JobCard>> GetJobCardsByVehicleIdAsync(int vehicleId);
    Task<IEnumerable<JobCard>> GetJobCardsByAssignedUserAsync(int userId);
    Task<IEnumerable<JobCard>> GetJobCardsByStatusAsync(string status);
    Task<IEnumerable<JobCard>> GetOpenJobCardsAsync();
    Task<JobCard> CreateJobCardAsync(JobCard jobCard);
    Task<JobCard> UpdateJobCardAsync(JobCard jobCard);
    Task<bool> DeleteJobCardAsync(int id);
    
    // JobCardTask methods
    Task<IEnumerable<JobCardTask>> GetTasksByJobCardIdAsync(int jobCardId);
    Task<JobCardTask> AddTaskToJobCardAsync(int jobCardId, JobCardTask task);
    Task<JobCardTask> UpdateTaskAsync(JobCardTask task);
}
