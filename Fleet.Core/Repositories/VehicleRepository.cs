using Fleet.Core.Data;
using Fleet.Core.Domain;
using Fleet.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Fleet.Core.Repositories;

/// <summary>
/// Vehicle repository with multi-tenant support
/// All queries are automatically filtered by current user's TenantId
/// Inherits from BaseTenantRepository for automatic tenant isolation
/// </summary>
public class VehicleRepository : BaseTenantRepository<Vehicle>, IVehicleRepository
{
    public VehicleRepository(ApplicationDbContext context, ITenantService tenantService) 
        : base(context, tenantService)
    {
    }

    /// <summary>
    /// Gets vehicle by registration number (tenant-scoped)
    /// Only returns vehicle if it belongs to current tenant
    /// </summary>
    public async Task<Vehicle?> GetByRegistrationNumberAsync(string registrationNumber)
    {
        // Global query filter ensures only current tenant's vehicles are returned
        return await _dbSet
            .AsNoTracking()
            .FirstOrDefaultAsync(v => v.RegistrationNumber == registrationNumber);
    }

    /// <summary>
    /// Gets vehicle by VIN (tenant-scoped)
    /// Only returns vehicle if it belongs to current tenant
    /// </summary>
    public async Task<Vehicle?> GetByVINAsync(string vin)
    {
        // Global query filter ensures only current tenant's vehicles are returned
        return await _dbSet
            .AsNoTracking()
            .FirstOrDefaultAsync(v => v.VIN == vin);
    }

    /// <summary>
    /// Gets vehicles by fleet ID (tenant-scoped)
    /// Only returns vehicles from fleets belonging to current tenant
    /// </summary>
    public async Task<IEnumerable<Vehicle>> GetVehiclesByFleetIdAsync(int fleetId)
    {
        // Global query filter ensures only current tenant's vehicles are returned
        return await _dbSet
            .AsNoTracking()
            .Where(v => v.FleetId == fleetId)
            .ToListAsync();
    }

    /// <summary>
    /// Gets vehicles by status (tenant-scoped)
    /// Only returns vehicles belonging to current tenant
    /// </summary>
    public async Task<IEnumerable<Vehicle>> GetVehiclesByStatusAsync(string status)
    {
        // Global query filter ensures only current tenant's vehicles are returned
        return await _dbSet
            .AsNoTracking()
            .Where(v => v.Status == status)
            .ToListAsync();
    }

    /// <summary>
    /// Gets all vehicles (tenant-scoped)
    /// Only returns vehicles belonging to current tenant
    /// Returns basic vehicle data without navigation properties to avoid circular references
    /// </summary>
    public override async Task<IEnumerable<Vehicle>> GetAllAsync()
    {
        // Global query filter ensures only current tenant's vehicles are returned
        // Don't include navigation properties to avoid circular references and large payloads
        return await _dbSet
            .AsNoTracking()
            .ToListAsync();
    }

    /// <summary>
    /// Gets vehicle by ID (tenant-scoped)
    /// Only returns vehicle if it belongs to current tenant
    /// </summary>
    public override async Task<Vehicle?> GetByIdAsync(int id)
    {
        // Global query filter ensures only current tenant's vehicles are returned
        return await _dbSet
            .AsNoTracking()
            .FirstOrDefaultAsync(v => v.Id == id);
    }
}
