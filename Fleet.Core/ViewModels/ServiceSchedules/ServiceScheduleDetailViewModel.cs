namespace Fleet.Core.ViewModels.ServiceSchedules;

public class ServiceScheduleDetailViewModel
{
    public int Id { get; set; }
    public int VehicleId { get; set; }
    public string? VehicleRegistration { get; set; }
    public string ServiceType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime ScheduledDate { get; set; }
    public DateTime? CompletedDate { get; set; }
    public decimal MileageAtService { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
