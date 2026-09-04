using Fleet.Core.ViewModels.Reports;

namespace Fleet.Core.Services;

public interface IMaintenanceReportService
{
    Task<VehicleCostReportViewModel?> GetVehicleCostReportAsync(int vehicleId);
    Task<FleetCostReportViewModel> GetFleetCostReportAsync(int fleetId);
}
