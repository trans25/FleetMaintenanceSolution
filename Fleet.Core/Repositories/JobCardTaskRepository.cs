using Fleet.Core.Data;
using Fleet.Core.Domain;
using Fleet.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Fleet.Core.Repositories;

public class JobCardTaskRepository : Repository<JobCardTask>, IJobCardTaskRepository
{
    public JobCardTaskRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<JobCardTask>> GetTasksByJobCardIdAsync(int jobCardId)
    {
        return await _dbSet
            .Include(t => t.JobCard)
            .Where(t => t.JobCardId == jobCardId)
            .OrderBy(t => t.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<JobCardTask>> GetCompletedTasksAsync()
    {
        return await _dbSet
            .Include(t => t.JobCard)
            .Where(t => t.IsCompleted)
            .OrderByDescending(t => t.CompletedDate)
            .ToListAsync();
    }

    public async Task<IEnumerable<JobCardTask>> GetPendingTasksAsync()
    {
        return await _dbSet
            .Include(t => t.JobCard)
            .Where(t => !t.IsCompleted)
            .OrderBy(t => t.CreatedAt)
            .ToListAsync();
    }

    public override async Task<IEnumerable<JobCardTask>> GetAllAsync()
    {
        return await _dbSet
            .Include(t => t.JobCard)
            .ToListAsync();
    }

    public override async Task<JobCardTask?> GetByIdAsync(int id)
    {
        return await _dbSet
            .Include(t => t.JobCard)
            .FirstOrDefaultAsync(t => t.Id == id);
    }
}
