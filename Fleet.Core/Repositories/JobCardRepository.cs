using Fleet.Core.Data;
using Fleet.Core.Domain;
using Fleet.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Fleet.Core.Repositories;

public class JobCardRepository : Repository<JobCard>, IJobCardRepository
{
    public JobCardRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<JobCard?> GetByJobNumberAsync(string jobNumber)
    {
        return await _dbSet
            .Include(j => j.Vehicle)
            .Include(j => j.Fault)
            .Include(j => j.AssignedTo)
            .Include(j => j.Tasks)
            .FirstOrDefaultAsync(j => j.JobNumber == jobNumber);
    }

    public async Task<IEnumerable<JobCard>> GetJobCardsByVehicleIdAsync(int vehicleId)
    {
        return await _dbSet
            .Include(j => j.Vehicle)
            .Include(j => j.Fault)
            .Include(j => j.AssignedTo)
            .Include(j => j.Tasks)
            .Where(j => j.VehicleId == vehicleId)
            .OrderByDescending(j => j.CreatedDate)
            .ToListAsync();
    }

    public async Task<IEnumerable<JobCard>> GetJobCardsByStatusAsync(string status)
    {
        return await _dbSet
            .Include(j => j.Vehicle)
            .Include(j => j.AssignedTo)
            .Where(j => j.Status == status)
            .OrderByDescending(j => j.CreatedDate)
            .ToListAsync();
    }

    public async Task<IEnumerable<JobCard>> GetJobCardsByAssignedUserAsync(int userId)
    {
        return await _dbSet
            .Include(j => j.Vehicle)
            .Include(j => j.Fault)
            .Include(j => j.Tasks)
            .Where(j => j.AssignedToUserId == userId)
            .OrderByDescending(j => j.CreatedDate)
            .ToListAsync();
    }

    public override async Task<IEnumerable<JobCard>> GetAllAsync()
    {
        return await _dbSet
            .Include(j => j.Vehicle)
            .Include(j => j.Fault)
            .Include(j => j.AssignedTo)
            .Include(j => j.Tasks)
            .ToListAsync();
    }

    public override async Task<JobCard?> GetByIdAsync(int id)
    {
        return await _dbSet
            .Include(j => j.Vehicle)
            .Include(j => j.Fault)
            .Include(j => j.AssignedTo)
            .Include(j => j.Tasks)
            .FirstOrDefaultAsync(j => j.Id == id);
    }
}
