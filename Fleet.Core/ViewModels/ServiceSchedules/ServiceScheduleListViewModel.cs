namespace Fleet.Core.ViewModels.ServiceSchedules;

public class ServiceScheduleListViewModel
{
    public int Id { get; set; }
    public int VehicleId { get; set; }
    public string? VehicleRegistration { get; set; }
    public string ServiceType { get; set; } = string.Empty;
    public DateTime ScheduledDate { get; set; }
    public DateTime? CompletedDate { get; set; }
    public string Status { get; set; } = string.Empty;
}
