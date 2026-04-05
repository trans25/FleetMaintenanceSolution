using Fleet.Core.Data;
using Fleet.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Fleet.Core.Repositories;

public class FleetRepository : Repository<Domain.Fleet>, IFleetRepository
{
    public FleetRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Domain.Fleet>> GetFleetsByTenantIdAsync(int tenantId)
    {
        return await _dbSet
            .Include(f => f.Vehicles)
            .Where(f => f.TenantId == tenantId)
            .ToListAsync();
    }

    public async Task<IEnumerable<Domain.Fleet>> GetActiveFleetsAsync()
    {
        return await _dbSet
            .Include(f => f.Vehicles)
            .Where(f => f.IsActive)
            .ToListAsync();
    }

    public override async Task<IEnumerable<Domain.Fleet>> GetAllAsync()
    {
        return await _dbSet
            .Include(f => f.Tenant)
            .Include(f => f.Vehicles)
            .ToListAsync();
    }

    public override async Task<Domain.Fleet?> GetByIdAsync(int id)
    {
        return await _dbSet
            .Include(f => f.Tenant)
            .Include(f => f.Vehicles)
            .FirstOrDefaultAsync(f => f.Id == id);
    }
}
