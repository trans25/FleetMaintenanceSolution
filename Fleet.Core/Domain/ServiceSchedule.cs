namespace Fleet.Core.Domain;

public class ServiceSchedule : BaseTenantEntity
{
    public int VehicleId { get; set; }
    public string ServiceType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime ScheduledDate { get; set; }
    public DateTime? CompletedDate { get; set; }
    public decimal MileageAtService { get; set; }
    public string Status { get; set; } = "Scheduled"; // Scheduled, Completed, Cancelled
    public string? Notes { get; set; }

    // Navigation properties
    public Vehicle Vehicle { get; set; } = null!;
}
