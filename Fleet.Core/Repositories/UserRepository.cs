using Fleet.Core.Data;
using Fleet.Core.Domain;
using Fleet.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Fleet.Core.Repositories;

public class UserRepository : Repository<User>, IUserRepository
{
    public UserRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<User?> GetByUsernameAsync(string username)
    {
        return await _dbSet
            .Include(u => u.Roles)
            .Include(u => u.Tenant)
            .FirstOrDefaultAsync(u => u.Username == username);
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _dbSet
            .Include(u => u.Roles)
            .Include(u => u.Tenant)
            .FirstOrDefaultAsync(u => u.Email == email);
    }

    public async Task<IEnumerable<User>> GetUsersByTenantIdAsync(int tenantId)
    {
        return await _dbSet
            .Include(u => u.Roles)
            .Where(u => u.TenantId == tenantId)
            .ToListAsync();
    }

    public override async Task<IEnumerable<User>> GetAllAsync()
    {
        return await _dbSet
            .Include(u => u.Roles)
            .Include(u => u.Tenant)
            .ToListAsync();
    }

    public override async Task<User?> GetByIdAsync(int id)
    {
        return await _dbSet
            .Include(u => u.Roles)
            .Include(u => u.Tenant)
            .FirstOrDefaultAsync(u => u.Id == id);
    }
}
