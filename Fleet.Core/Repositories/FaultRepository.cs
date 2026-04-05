using Fleet.Core.Data;
using Fleet.Core.Domain;
using Fleet.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Fleet.Core.Repositories;

/// <summary>
/// Fault repository with multi-tenant support
/// </summary>
public class FaultRepository : BaseTenantRepository<Fault>, IFaultRepository
{
    public FaultRepository(ApplicationDbContext context, ITenantService tenantService) 
        : base(context, tenantService)
    {
    }

    public async Task<IEnumerable<Fault>> GetFaultsByVehicleIdAsync(int vehicleId)
    {
        return await _dbSet
            .AsNoTracking()
            .Where(f => f.VehicleId == vehicleId)
            .OrderByDescending(f => f.ReportedDate)
            .ToListAsync();
    }

    public async Task<IEnumerable<Fault>> GetFaultsByStatusAsync(string status)
    {
        return await _dbSet
            .AsNoTracking()
            .Where(f => f.Status == status)
            .OrderByDescending(f => f.ReportedDate)
            .ToListAsync();
    }

    public async Task<IEnumerable<Fault>> GetFaultsBySeverityAsync(string severity)
    {
        return await _dbSet
            .AsNoTracking()
            .Where(f => f.Severity == severity)
            .OrderByDescending(f => f.ReportedDate)
            .ToListAsync();
    }

    public override async Task<IEnumerable<Fault>> GetAllAsync()
    {
        return await _dbSet
            .AsNoTracking()
            .ToListAsync();
    }

    public override async Task<Fault?> GetByIdAsync(int id)
    {
        return await _dbSet
            .AsNoTracking()
            .FirstOrDefaultAsync(f => f.Id == id);
    }
}
