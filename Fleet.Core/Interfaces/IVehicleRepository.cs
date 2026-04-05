using Fleet.Core.Domain;

namespace Fleet.Core.Interfaces;

public interface IVehicleRepository : IRepository<Vehicle>
{
    Task<Vehicle?> GetByRegistrationNumberAsync(string registrationNumber);
    Task<Vehicle?> GetByVINAsync(string vin);
    Task<IEnumerable<Vehicle>> GetVehiclesByFleetIdAsync(int fleetId);
    Task<IEnumerable<Vehicle>> GetVehiclesByStatusAsync(string status);
}
