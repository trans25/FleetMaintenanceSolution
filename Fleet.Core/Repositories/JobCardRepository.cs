using Fleet.Core.Data;
using Fleet.Core.Domain;
using Fleet.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Fleet.Core.Repositories;

/// <summary>
/// JobCard repository with multi-tenant support
/// </summary>
public class JobCardRepository : BaseTenantRepository<JobCard>, IJobCardRepository
{
    public JobCardRepository(ApplicationDbContext context, ITenantService tenantService) 
        : base(context, tenantService)
    {
    }

    public async Task<JobCard?> GetByJobNumberAsync(string jobNumber)
    {
        return await _dbSet
            .AsNoTracking()
            .FirstOrDefaultAsync(j => j.JobNumber == jobNumber);
    }

    public async Task<IEnumerable<JobCard>> GetJobCardsByVehicleIdAsync(int vehicleId)
    {
        return await _dbSet
            .AsNoTracking()
            .Where(j => j.VehicleId == vehicleId)
            .OrderByDescending(j => j.CreatedDate)
            .ToListAsync();
    }

    public async Task<IEnumerable<JobCard>> GetJobCardsByStatusAsync(string status)
    {
        return await _dbSet
            .AsNoTracking()
            .Where(j => j.Status == status)
            .OrderByDescending(j => j.CreatedDate)
            .ToListAsync();
    }

    public async Task<IEnumerable<JobCard>> GetJobCardsByAssignedUserAsync(int userId)
    {
        return await _dbSet
            .AsNoTracking()
            .Where(j => j.AssignedToUserId == userId)
            .OrderByDescending(j => j.CreatedDate)
            .ToListAsync();
    }

    public override async Task<IEnumerable<JobCard>> GetAllAsync()
    {
        return await _dbSet
            .AsNoTracking()
            .ToListAsync();
    }

    public override async Task<JobCard?> GetByIdAsync(int id)
    {
        return await _dbSet
            .AsNoTracking()
            .FirstOrDefaultAsync(j => j.Id == id);
    }
}
