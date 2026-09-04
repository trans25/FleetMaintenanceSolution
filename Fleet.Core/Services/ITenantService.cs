using Fleet.Core.Domain;

namespace Fleet.Core.Services;

public interface ITenantService
{
    Task<IEnumerable<Tenant>> GetAllTenantsAsync();
    Task<Tenant?> GetTenantByIdAsync(int id);
    Task<Tenant?> GetTenantByNameAsync(string name);
    Task<IEnumerable<Tenant>> GetActiveTenantsAsync();
    Task<Tenant> CreateTenantAsync(Tenant tenant);
    Task<Tenant> UpdateTenantAsync(Tenant tenant);
    Task<bool> DeleteTenantAsync(int id);
}
