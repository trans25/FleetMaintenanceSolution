using Fleet.Core.Domain;

namespace Fleet.Core.Services;

public interface IFaultService
{
    Task<IEnumerable<Fault>> GetAllFaultsAsync();
    Task<Fault?> GetFaultByIdAsync(int id);
    Task<IEnumerable<Fault>> GetFaultsByVehicleIdAsync(int vehicleId);
    Task<IEnumerable<Fault>> GetFaultsByStatusAsync(string status);
    Task<IEnumerable<Fault>> GetFaultsBySeverityAsync(string severity);
    Task<IEnumerable<Fault>> GetOpenFaultsAsync();
    Task<Fault> ReportFaultAsync(Fault fault);
    Task<Fault> UpdateFaultAsync(Fault fault);
    Task<bool> DeleteFaultAsync(int id);
}
