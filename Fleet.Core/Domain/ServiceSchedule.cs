namespace Fleet.Core.Domain;

public class ServiceSchedule
{
    public int Id { get; set; }
    public int VehicleId { get; set; }
    public string ServiceType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime ScheduledDate { get; set; }
    public DateTime? CompletedDate { get; set; }
    public decimal MileageAtService { get; set; }
    public string Status { get; set; } = "Scheduled"; // Scheduled, Completed, Cancelled
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public Vehicle Vehicle { get; set; } = null!;
}
