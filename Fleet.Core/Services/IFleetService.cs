namespace Fleet.Core.Services;

public interface IFleetService
{
    Task<IEnumerable<Domain.Fleet>> GetAllFleetsAsync();
    Task<Domain.Fleet?> GetFleetByIdAsync(int id);
    Task<IEnumerable<Domain.Fleet>> GetFleetsByTenantIdAsync(int tenantId);
    Task<IEnumerable<Domain.Fleet>> GetActiveFleetsAsync();
    Task<Domain.Fleet> CreateFleetAsync(Domain.Fleet fleet);
    Task<Domain.Fleet> UpdateFleetAsync(Domain.Fleet fleet);
    Task<bool> DeleteFleetAsync(int id);
}
