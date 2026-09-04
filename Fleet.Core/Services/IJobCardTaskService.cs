using Fleet.Core.Domain;

namespace Fleet.Core.Services;

public interface IJobCardTaskService
{
    Task<IEnumerable<JobCardTask>> GetAllTasksAsync();
    Task<JobCardTask?> GetTaskByIdAsync(int id);
    Task<IEnumerable<JobCardTask>> GetTasksByJobCardIdAsync(int jobCardId);
    Task<IEnumerable<JobCardTask>> GetCompletedTasksAsync();
    Task<IEnumerable<JobCardTask>> GetPendingTasksAsync();
    Task<JobCardTask> CreateTaskAsync(JobCardTask task);
    Task<JobCardTask> UpdateTaskAsync(JobCardTask task);
    Task<bool> DeleteTaskAsync(int id);
}
