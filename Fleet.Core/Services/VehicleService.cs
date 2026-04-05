using Fleet.Core.Domain;
using Fleet.Core.Interfaces;

namespace Fleet.Core.Services;

public class VehicleService : IVehicleService
{
    private readonly IVehicleRepository _vehicleRepository;

    public VehicleService(IVehicleRepository vehicleRepository)
    {
        _vehicleRepository = vehicleRepository;
    }

    public async Task<IEnumerable<Vehicle>> GetAllVehiclesAsync()
    {
        return await _vehicleRepository.GetAllAsync();
    }

    public async Task<Vehicle?> GetVehicleByIdAsync(int id)
    {
        return await _vehicleRepository.GetByIdAsync(id);
    }

    public async Task<Vehicle?> GetVehicleByRegistrationAsync(string registrationNumber)
    {
        return await _vehicleRepository.GetByRegistrationNumberAsync(registrationNumber);
    }

    public async Task<Vehicle?> GetVehicleByVINAsync(string vin)
    {
        return await _vehicleRepository.GetByVINAsync(vin);
    }

    public async Task<IEnumerable<Vehicle>> GetVehiclesByFleetIdAsync(int fleetId)
    {
        return await _vehicleRepository.GetVehiclesByFleetIdAsync(fleetId);
    }

    public async Task<IEnumerable<Vehicle>> GetVehiclesByStatusAsync(string status)
    {
        return await _vehicleRepository.GetVehiclesByStatusAsync(status);
    }

    public async Task<Vehicle> CreateVehicleAsync(Vehicle vehicle)
    {
        vehicle.CreatedAt = DateTime.UtcNow;
        return await _vehicleRepository.AddAsync(vehicle);
    }

    public async Task<Vehicle> UpdateVehicleAsync(Vehicle vehicle)
    {
        vehicle.UpdatedAt = DateTime.UtcNow;
        return await _vehicleRepository.UpdateAsync(vehicle);
    }

    public async Task<bool> DeleteVehicleAsync(int id)
    {
        return await _vehicleRepository.DeleteAsync(id);
    }
}
