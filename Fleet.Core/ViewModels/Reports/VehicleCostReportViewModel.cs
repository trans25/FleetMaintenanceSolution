namespace Fleet.Core.ViewModels.Reports;

public class VehicleCostReportViewModel
{
    public int VehicleId { get; set; }
    public string RegistrationNumber { get; set; } = string.Empty;
    public string VIN { get; set; } = string.Empty;
    public int FleetId { get; set; }
    public int TotalJobCards { get; set; }
    public int CompletedJobCards { get; set; }
    public int OpenJobCards { get; set; }
    public decimal TotalEstimatedCost { get; set; }
    public decimal TotalActualCost { get; set; }
}
