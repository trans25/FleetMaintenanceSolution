using Fleet.Core.Data;
using Fleet.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Fleet.Core.Repositories;

/// <summary>
/// Fleet repository with multi-tenant support
/// </summary>
public class FleetRepository : BaseTenantRepository<Domain.Fleet>, IFleetRepository
{
    public FleetRepository(ApplicationDbContext context, ITenantService tenantService) 
        : base(context, tenantService)
    {
    }

    public async Task<IEnumerable<Domain.Fleet>> GetFleetsByTenantIdAsync(int tenantId)
    {
        return await _dbSet
            .AsNoTracking()
            .Where(f => f.TenantId == tenantId)
            .ToListAsync();
    }

    public async Task<IEnumerable<Domain.Fleet>> GetActiveFleetsAsync()
    {
        return await _dbSet
            .AsNoTracking()
            .Where(f => f.IsActive)
            .ToListAsync();
    }

    public override async Task<IEnumerable<Domain.Fleet>> GetAllAsync()
    {
        return await _dbSet
            .AsNoTracking()
            .ToListAsync();
    }

    public override async Task<Domain.Fleet?> GetByIdAsync(int id)
    {
        return await _dbSet
            .AsNoTracking()
            .FirstOrDefaultAsync(f => f.Id == id);
    }
}
