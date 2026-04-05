using Fleet.Core.Data;
using Fleet.Core.Domain;
using Fleet.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Fleet.Core.Repositories;

public class FaultRepository : Repository<Fault>, IFaultRepository
{
    public FaultRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Fault>> GetFaultsByVehicleIdAsync(int vehicleId)
    {
        return await _dbSet
            .Include(f => f.Vehicle)
            .Where(f => f.VehicleId == vehicleId)
            .OrderByDescending(f => f.ReportedDate)
            .ToListAsync();
    }

    public async Task<IEnumerable<Fault>> GetFaultsByStatusAsync(string status)
    {
        return await _dbSet
            .Include(f => f.Vehicle)
            .Where(f => f.Status == status)
            .OrderByDescending(f => f.ReportedDate)
            .ToListAsync();
    }

    public async Task<IEnumerable<Fault>> GetFaultsBySeverityAsync(string severity)
    {
        return await _dbSet
            .Include(f => f.Vehicle)
            .Where(f => f.Severity == severity)
            .OrderByDescending(f => f.ReportedDate)
            .ToListAsync();
    }

    public override async Task<IEnumerable<Fault>> GetAllAsync()
    {
        return await _dbSet
            .Include(f => f.Vehicle)
            .Include(f => f.JobCards)
            .ToListAsync();
    }

    public override async Task<Fault?> GetByIdAsync(int id)
    {
        return await _dbSet
            .Include(f => f.Vehicle)
            .Include(f => f.JobCards)
            .FirstOrDefaultAsync(f => f.Id == id);
    }
}
