using Fleet.Core.Data;
using Fleet.Core.Domain;
using Fleet.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Fleet.Core.Repositories;

public class ManufacturerRepository : Repository<Manufacturer>, IManufacturerRepository
{
    public ManufacturerRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<Manufacturer?> GetByNameAsync(string name)
    {
        return await _dbSet
            .FirstOrDefaultAsync(m => m.Name == name);
    }

    public override async Task<IEnumerable<Manufacturer>> GetAllAsync()
    {
        return await _dbSet
            .Include(m => m.Vehicles)
            .ToListAsync();
    }

    public override async Task<Manufacturer?> GetByIdAsync(int id)
    {
        return await _dbSet
            .Include(m => m.Vehicles)
            .FirstOrDefaultAsync(m => m.Id == id);
    }
}
