using Fleet.Core.Domain;
using Fleet.Core.Interfaces;

namespace Fleet.Core.Services;

public class TenantService : ITenantService
{
    private readonly ITenantRepository _tenantRepository;

    public TenantService(ITenantRepository tenantRepository)
    {
        _tenantRepository = tenantRepository;
    }

    public async Task<IEnumerable<Tenant>> GetAllTenantsAsync()
    {
        return await _tenantRepository.GetAllAsync();
    }

    public async Task<Tenant?> GetTenantByIdAsync(int id)
    {
        return await _tenantRepository.GetByIdAsync(id);
    }

    public async Task<Tenant?> GetTenantByNameAsync(string name)
    {
        return await _tenantRepository.GetByNameAsync(name);
    }

    public async Task<IEnumerable<Tenant>> GetActiveTenantsAsync()
    {
        return await _tenantRepository.GetActiveTenantsAsync();
    }

    public async Task<Tenant> CreateTenantAsync(Tenant tenant)
    {
        tenant.CreatedAt = DateTime.UtcNow;
        return await _tenantRepository.AddAsync(tenant);
    }

    public async Task<Tenant> UpdateTenantAsync(Tenant tenant)
    {
        tenant.UpdatedAt = DateTime.UtcNow;
        return await _tenantRepository.UpdateAsync(tenant);
    }

    public async Task<bool> DeleteTenantAsync(int id)
    {
        return await _tenantRepository.DeleteAsync(id);
    }
}
