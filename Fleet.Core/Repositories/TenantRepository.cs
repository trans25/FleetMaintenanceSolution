using Fleet.Core.Data;
using Fleet.Core.Domain;
using Fleet.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Fleet.Core.Repositories;

public class TenantRepository : Repository<Tenant>, ITenantRepository
{
    public TenantRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<Tenant?> GetByNameAsync(string name)
    {
        return await _dbSet
            .FirstOrDefaultAsync(t => t.Name == name);
    }

    public async Task<IEnumerable<Tenant>> GetActiveTenantsAsync()
    {
        return await _dbSet
            .Where(t => t.IsActive)
            .ToListAsync();
    }

    public override async Task<IEnumerable<Tenant>> GetAllAsync()
    {
        return await _dbSet
            .Include(t => t.Users)
            .Include(t => t.Fleets)
            .ToListAsync();
    }

    public override async Task<Tenant?> GetByIdAsync(int id)
    {
        return await _dbSet
            .Include(t => t.Users)
            .Include(t => t.Fleets)
            .FirstOrDefaultAsync(t => t.Id == id);
    }
}
