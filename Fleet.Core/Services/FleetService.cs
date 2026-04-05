using Fleet.Core.Interfaces;

namespace Fleet.Core.Services;

public class FleetService : IFleetService
{
    private readonly IFleetRepository _fleetRepository;

    public FleetService(IFleetRepository fleetRepository)
    {
        _fleetRepository = fleetRepository;
    }

    public async Task<IEnumerable<Domain.Fleet>> GetAllFleetsAsync()
    {
        return await _fleetRepository.GetAllAsync();
    }

    public async Task<Domain.Fleet?> GetFleetByIdAsync(int id)
    {
        return await _fleetRepository.GetByIdAsync(id);
    }

    public async Task<IEnumerable<Domain.Fleet>> GetFleetsByTenantIdAsync(int tenantId)
    {
        return await _fleetRepository.GetFleetsByTenantIdAsync(tenantId);
    }

    public async Task<IEnumerable<Domain.Fleet>> GetActiveFleetsAsync()
    {
        return await _fleetRepository.GetActiveFleetsAsync();
    }

    public async Task<Domain.Fleet> CreateFleetAsync(Domain.Fleet fleet)
    {
        fleet.CreatedAt = DateTime.UtcNow;
        fleet.IsActive = true;
        return await _fleetRepository.AddAsync(fleet);
    }

    public async Task<Domain.Fleet> UpdateFleetAsync(Domain.Fleet fleet)
    {
        fleet.UpdatedAt = DateTime.UtcNow;
        return await _fleetRepository.UpdateAsync(fleet);
    }

    public async Task<bool> DeleteFleetAsync(int id)
    {
        return await _fleetRepository.DeleteAsync(id);
    }
}
