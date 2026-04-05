namespace Maintenance.API.ViewModels;

public class CreateServiceScheduleViewModel
{
    public int TenantId { get; set; }
    public int VehicleId { get; set; }
    public string ServiceType { get; set; } = string.Empty;
    public DateTime ScheduledDate { get; set; }
    public decimal MileageAtService { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = "Scheduled";
}
