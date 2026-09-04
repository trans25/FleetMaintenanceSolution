namespace Fleet.Core.ViewModels.Reports;

public class FleetCostReportViewModel
{
    public int FleetId { get; set; }
    public int VehicleCount { get; set; }
    public int TotalJobCards { get; set; }
    public int CompletedJobCards { get; set; }
    public int OpenJobCards { get; set; }
    public decimal TotalEstimatedCost { get; set; }
    public decimal TotalActualCost { get; set; }
    public IEnumerable<VehicleCostReportViewModel> Vehicles { get; set; } = new List<VehicleCostReportViewModel>();
}
