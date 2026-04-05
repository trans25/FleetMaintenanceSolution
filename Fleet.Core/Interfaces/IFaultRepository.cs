using Fleet.Core.Domain;

namespace Fleet.Core.Interfaces;

public interface IFaultRepository : IRepository<Fault>
{
    Task<IEnumerable<Fault>> GetFaultsByVehicleIdAsync(int vehicleId);
    Task<IEnumerable<Fault>> GetFaultsByStatusAsync(string status);
    Task<IEnumerable<Fault>> GetFaultsBySeverityAsync(string severity);
}
