namespace Maintenance.API.ViewModels;

public class UpdateFaultViewModel
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int VehicleId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Severity { get; set; } = "Medium";
    public string Status { get; set; } = "Reported";
    public DateTime ReportedDate { get; set; }
    public DateTime? ResolvedDate { get; set; }
    public int? ReportedByUserId { get; set; }
}
