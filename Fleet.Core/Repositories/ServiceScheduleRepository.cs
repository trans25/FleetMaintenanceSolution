using Fleet.Core.Data;
using Fleet.Core.Domain;
using Fleet.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Fleet.Core.Repositories;

public class ServiceScheduleRepository : Repository<ServiceSchedule>, IServiceScheduleRepository
{
    public ServiceScheduleRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<ServiceSchedule>> GetSchedulesByVehicleIdAsync(int vehicleId)
    {
        return await _dbSet
            .Include(s => s.Vehicle)
            .Where(s => s.VehicleId == vehicleId)
            .OrderBy(s => s.ScheduledDate)
            .ToListAsync();
    }

    public async Task<IEnumerable<ServiceSchedule>> GetSchedulesByStatusAsync(string status)
    {
        return await _dbSet
            .Include(s => s.Vehicle)
            .Where(s => s.Status == status)
            .OrderBy(s => s.ScheduledDate)
            .ToListAsync();
    }

    public async Task<IEnumerable<ServiceSchedule>> GetUpcomingServicesAsync(DateTime date)
    {
        return await _dbSet
            .Include(s => s.Vehicle)
            .Where(s => s.ScheduledDate >= date && s.Status == "Scheduled")
            .OrderBy(s => s.ScheduledDate)
            .ToListAsync();
    }

    public override async Task<IEnumerable<ServiceSchedule>> GetAllAsync()
    {
        return await _dbSet
            .Include(s => s.Vehicle)
            .ToListAsync();
    }

    public override async Task<ServiceSchedule?> GetByIdAsync(int id)
    {
        return await _dbSet
            .Include(s => s.Vehicle)
            .FirstOrDefaultAsync(s => s.Id == id);
    }
}
