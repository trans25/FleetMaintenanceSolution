using Fleet.Core.Data;
using Fleet.Core.Domain;
using Fleet.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Fleet.Core.Repositories;

/// <summary>
/// ServiceSchedule repository with multi-tenant support
/// </summary>
public class ServiceScheduleRepository : BaseTenantRepository<ServiceSchedule>, IServiceScheduleRepository
{
    public ServiceScheduleRepository(ApplicationDbContext context, ITenantService tenantService) 
        : base(context, tenantService)
    {
    }

    public async Task<IEnumerable<ServiceSchedule>> GetSchedulesByVehicleIdAsync(int vehicleId)
    {
        return await _dbSet
            .AsNoTracking()
            .Where(s => s.VehicleId == vehicleId)
            .OrderBy(s => s.ScheduledDate)
            .ToListAsync();
    }

    public async Task<IEnumerable<ServiceSchedule>> GetSchedulesByStatusAsync(string status)
    {
        return await _dbSet
            .AsNoTracking()
            .Where(s => s.Status == status)
            .OrderBy(s => s.ScheduledDate)
            .ToListAsync();
    }

    public async Task<IEnumerable<ServiceSchedule>> GetUpcomingServicesAsync(DateTime date)
    {
        return await _dbSet
            .AsNoTracking()
            .Where(s => s.ScheduledDate >= date && s.Status == "Scheduled")
            .OrderBy(s => s.ScheduledDate)
            .ToListAsync();
    }

    public override async Task<IEnumerable<ServiceSchedule>> GetAllAsync()
    {
        return await _dbSet
            .AsNoTracking()
            .ToListAsync();
    }

    public override async Task<ServiceSchedule?> GetByIdAsync(int id)
    {
        return await _dbSet
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == id);
    }
}
