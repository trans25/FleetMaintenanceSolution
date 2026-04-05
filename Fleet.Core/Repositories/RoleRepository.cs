using Fleet.Core.Data;
using Fleet.Core.Domain;
using Fleet.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Fleet.Core.Repositories;

public class RoleRepository : Repository<Role>, IRoleRepository
{
    public RoleRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<Role?> GetByNameAsync(string name)
    {
        return await _dbSet
            .FirstOrDefaultAsync(r => r.Name == name);
    }

    public override async Task<IEnumerable<Role>> GetAllAsync()
    {
        return await _dbSet
            .Include(r => r.Users)
            .ToListAsync();
    }

    public override async Task<Role?> GetByIdAsync(int id)
    {
        return await _dbSet
            .Include(r => r.Users)
            .FirstOrDefaultAsync(r => r.Id == id);
    }
}
