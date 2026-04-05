using Fleet.Core.Domain;

namespace Fleet.Core.Interfaces;

public interface IJobCardTaskRepository : IRepository<JobCardTask>
{
    Task<IEnumerable<JobCardTask>> GetTasksByJobCardIdAsync(int jobCardId);
    Task<IEnumerable<JobCardTask>> GetCompletedTasksAsync();
    Task<IEnumerable<JobCardTask>> GetPendingTasksAsync();
}
