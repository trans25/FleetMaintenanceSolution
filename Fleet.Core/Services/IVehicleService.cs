using Fleet.Core.Domain;

namespace Fleet.Core.Services;

public interface IVehicleService
{
    Task<IEnumerable<Vehicle>> GetAllVehiclesAsync();
    Task<Vehicle?> GetVehicleByIdAsync(int id);
    Task<Vehicle?> GetVehicleByRegistrationAsync(string registrationNumber);
    Task<Vehicle?> GetVehicleByVINAsync(string vin);
    Task<IEnumerable<Vehicle>> GetVehiclesByFleetIdAsync(int fleetId);
    Task<IEnumerable<Vehicle>> GetVehiclesByStatusAsync(string status);
    Task<Vehicle> CreateVehicleAsync(Vehicle vehicle);
    Task<Vehicle> UpdateVehicleAsync(Vehicle vehicle);
    Task<bool> DeleteVehicleAsync(int id);
}
