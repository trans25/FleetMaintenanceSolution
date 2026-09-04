using Fleet.Core.Common;
using Fleet.Core.Domain;
using Fleet.Core.Interfaces;
using Fleet.Core.ViewModels.Reports;

namespace Fleet.Core.Services;

public class MaintenanceReportService : IMaintenanceReportService
{
    private readonly IVehicleRepository _vehicleRepository;
    private readonly IJobCardRepository _jobCardRepository;

    public MaintenanceReportService(
        IVehicleRepository vehicleRepository,
        IJobCardRepository jobCardRepository)
    {
        _vehicleRepository = vehicleRepository;
        _jobCardRepository = jobCardRepository;
    }

    public async Task<VehicleCostReportViewModel?> GetVehicleCostReportAsync(int vehicleId)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(vehicleId);
        if (vehicle == null)
            return null;

        var jobCards = await _jobCardRepository.GetJobCardsByVehicleIdAsync(vehicleId);
        return BuildVehicleReport(vehicle, jobCards);
    }

    public async Task<FleetCostReportViewModel> GetFleetCostReportAsync(int fleetId)
    {
        var vehicles = await _vehicleRepository.GetVehiclesByFleetIdAsync(fleetId);

        var vehicleReports = new List<VehicleCostReportViewModel>();
        foreach (var vehicle in vehicles)
        {
            var jobCards = await _jobCardRepository.GetJobCardsByVehicleIdAsync(vehicle.Id);
            vehicleReports.Add(BuildVehicleReport(vehicle, jobCards));
        }

        return new FleetCostReportViewModel
        {
            FleetId = fleetId,
            VehicleCount = vehicleReports.Count,
            TotalJobCards = vehicleReports.Sum(v => v.TotalJobCards),
            CompletedJobCards = vehicleReports.Sum(v => v.CompletedJobCards),
            OpenJobCards = vehicleReports.Sum(v => v.OpenJobCards),
            TotalEstimatedCost = vehicleReports.Sum(v => v.TotalEstimatedCost),
            TotalActualCost = vehicleReports.Sum(v => v.TotalActualCost),
            Vehicles = vehicleReports
        };
    }

    private static VehicleCostReportViewModel BuildVehicleReport(Vehicle vehicle, IEnumerable<JobCard> jobCards)
    {
        var list = jobCards.ToList();

        return new VehicleCostReportViewModel
        {
            VehicleId = vehicle.Id,
            RegistrationNumber = vehicle.RegistrationNumber,
            VIN = vehicle.VIN,
            FleetId = vehicle.FleetId,
            TotalJobCards = list.Count,
            CompletedJobCards = list.Count(jc =>
                string.Equals(jc.Status, MaintenanceStatuses.JobCard.Completed, StringComparison.OrdinalIgnoreCase)),
            OpenJobCards = list.Count(jc =>
                jc.Status != MaintenanceStatuses.JobCard.Completed &&
                jc.Status != MaintenanceStatuses.JobCard.Cancelled),
            TotalEstimatedCost = list.Sum(jc => jc.EstimatedCost),
            TotalActualCost = list.Sum(jc => jc.ActualCost ?? 0m)
        };
    }
}
