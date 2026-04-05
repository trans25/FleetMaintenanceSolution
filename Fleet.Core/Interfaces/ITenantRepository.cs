using Fleet.Core.Domain;

namespace Fleet.Core.Interfaces;

public interface ITenantRepository : IRepository<Tenant>
{
    Task<Tenant?> GetByNameAsync(string name);
    Task<IEnumerable<Tenant>> GetActiveTenantsAsync();
}
