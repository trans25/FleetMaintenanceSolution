namespace Fleet.Core.ViewModels.Faults;

public class FaultListViewModel
{
    public int Id { get; set; }
    public int VehicleId { get; set; }
    public string? VehicleRegistration { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime ReportedDate { get; set; }
}
