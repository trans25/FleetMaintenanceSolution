using Fleet.Core.Domain;
using Fleet.Core.Interfaces;

namespace Fleet.Core.Services;

public class JobCardTaskService : IJobCardTaskService
{
    private readonly IJobCardTaskRepository _jobCardTaskRepository;

    public JobCardTaskService(IJobCardTaskRepository jobCardTaskRepository)
    {
        _jobCardTaskRepository = jobCardTaskRepository;
    }

    public async Task<IEnumerable<JobCardTask>> GetAllTasksAsync()
    {
        return await _jobCardTaskRepository.GetAllAsync();
    }

    public async Task<JobCardTask?> GetTaskByIdAsync(int id)
    {
        return await _jobCardTaskRepository.GetByIdAsync(id);
    }

    public async Task<IEnumerable<JobCardTask>> GetTasksByJobCardIdAsync(int jobCardId)
    {
        return await _jobCardTaskRepository.GetTasksByJobCardIdAsync(jobCardId);
    }

    public async Task<IEnumerable<JobCardTask>> GetCompletedTasksAsync()
    {
        return await _jobCardTaskRepository.GetCompletedTasksAsync();
    }

    public async Task<IEnumerable<JobCardTask>> GetPendingTasksAsync()
    {
        return await _jobCardTaskRepository.GetPendingTasksAsync();
    }

    public async Task<JobCardTask> CreateTaskAsync(JobCardTask task)
    {
        task.CreatedAt = DateTime.UtcNow;
        return await _jobCardTaskRepository.AddAsync(task);
    }

    public async Task<JobCardTask> UpdateTaskAsync(JobCardTask task)
    {
        task.UpdatedAt = DateTime.UtcNow;
        return await _jobCardTaskRepository.UpdateAsync(task);
    }

    public async Task<bool> DeleteTaskAsync(int id)
    {
        return await _jobCardTaskRepository.DeleteAsync(id);
    }
}
