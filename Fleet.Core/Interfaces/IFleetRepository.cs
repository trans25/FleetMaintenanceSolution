using Fleet.Core.Domain;

namespace Fleet.Core.Interfaces;

public interface IFleetRepository : IRepository<Domain.Fleet>
{
    Task<IEnumerable<Domain.Fleet>> GetFleetsByTenantIdAsync(int tenantId);
    Task<IEnumerable<Domain.Fleet>> GetActiveFleetsAsync();
}
