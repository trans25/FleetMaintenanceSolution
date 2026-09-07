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

    /// <summary>Suspends a tenant (IsActive = false); its users are blocked at login.</summary>
    Task<bool> SuspendTenantAsync(int id);

    /// <summary>Re-activates a previously suspended tenant.</summary>
    Task<bool> ActivateTenantAsync(int id);
}
