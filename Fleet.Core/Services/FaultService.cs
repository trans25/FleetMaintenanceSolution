using Fleet.Core.Common;
using Fleet.Core.Domain;
using Fleet.Core.Interfaces;

namespace Fleet.Core.Services;

public class FaultService : IFaultService
{
    private readonly IFaultRepository _faultRepository;

    public FaultService(IFaultRepository faultRepository)
    {
        _faultRepository = faultRepository;
    }

    public async Task<IEnumerable<Fault>> GetAllFaultsAsync()
    {
        return await _faultRepository.GetAllAsync();
    }

    public async Task<Fault?> GetFaultByIdAsync(int id)
    {
        return await _faultRepository.GetByIdAsync(id);
    }

    public async Task<IEnumerable<Fault>> GetFaultsByVehicleIdAsync(int vehicleId)
    {
        return await _faultRepository.GetFaultsByVehicleIdAsync(vehicleId);
    }

    public async Task<IEnumerable<Fault>> GetFaultsByStatusAsync(string status)
    {
        return await _faultRepository.GetFaultsByStatusAsync(status);
    }

    public async Task<IEnumerable<Fault>> GetFaultsBySeverityAsync(string severity)
    {
        return await _faultRepository.GetFaultsBySeverityAsync(severity);
    }

    public async Task<IEnumerable<Fault>> GetOpenFaultsAsync()
    {
        var allFaults = await _faultRepository.GetAllAsync();
        return allFaults.Where(f => 
            f.Status != "Resolved" && 
            f.ResolvedDate == null
        ).ToList();
    }

    public async Task<Fault> ReportFaultAsync(Fault fault)
    {
        fault.CreatedAt = DateTime.UtcNow;
        fault.ReportedDate = DateTime.UtcNow;
        fault.Status = MaintenanceStatuses.Fault.Reported;
        return await _faultRepository.AddAsync(fault);
    }

    public async Task<Fault> UpdateFaultAsync(Fault fault)
    {
        var existing = await _faultRepository.GetByIdAsync(fault.Id)
            ?? throw new KeyNotFoundException($"Fault with ID {fault.Id} not found.");

        MaintenanceStatuses.EnsureTransitionAllowed(
            MaintenanceStatuses.Fault.Transitions, existing.Status, fault.Status, "fault");

        fault.UpdatedAt = DateTime.UtcNow;

        // If marking as resolved, set the resolved date
        if (string.Equals(fault.Status, MaintenanceStatuses.Fault.Resolved, StringComparison.OrdinalIgnoreCase)
            && fault.ResolvedDate == null)
        {
            fault.ResolvedDate = DateTime.UtcNow;
        }

        return await _faultRepository.UpdateAsync(fault);
    }

    public async Task<bool> DeleteFaultAsync(int id)
    {
        return await _faultRepository.DeleteAsync(id);
    }
}
