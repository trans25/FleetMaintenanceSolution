using Fleet.Core.Data;
using Fleet.Core.Domain;
using Fleet.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Fleet.Core.Repositories;

public class ComplianceDocumentRepository : Repository<ComplianceDocument>, IComplianceDocumentRepository
{
    public ComplianceDocumentRepository(ApplicationDbContext context) : base(context)
    {
    }

    public IQueryable<ComplianceDocument> Query()
    {
        return _dbSet.Include(d => d.Vehicle).AsQueryable();
    }

    public async Task<IEnumerable<ComplianceDocument>> GetByVehicleIdAsync(int vehicleId)
    {
        return await _dbSet
            .Include(d => d.Vehicle)
            .Where(d => d.VehicleId == vehicleId)
            .OrderBy(d => d.ExpiryDate)
            .ToListAsync();
    }

    public async Task<IEnumerable<ComplianceDocument>> GetExpiringAsync(DateTime from, DateTime to)
    {
        return await _dbSet
            .Include(d => d.Vehicle)
            .Where(d => d.ExpiryDate >= from && d.ExpiryDate <= to)
            .OrderBy(d => d.ExpiryDate)
            .ToListAsync();
    }

    public async Task<IEnumerable<ComplianceDocument>> GetExpiredAsync(DateTime asOf)
    {
        return await _dbSet
            .Include(d => d.Vehicle)
            .Where(d => d.ExpiryDate < asOf)
            .OrderBy(d => d.ExpiryDate)
            .ToListAsync();
    }

    public override async Task<IEnumerable<ComplianceDocument>> GetAllAsync()
    {
        return await _dbSet
            .Include(d => d.Vehicle)
            .ToListAsync();
    }

    public override async Task<ComplianceDocument?> GetByIdAsync(int id)
    {
        return await _dbSet
            .Include(d => d.Vehicle)
            .FirstOrDefaultAsync(d => d.Id == id);
    }
}
