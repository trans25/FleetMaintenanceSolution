using System.ComponentModel.DataAnnotations;

namespace Fleet.Core.ViewModels.ServiceSchedules;

public class CreateServiceScheduleViewModel
{
    [Required]
    public int VehicleId { get; set; }

    [Required]
    [StringLength(100)]
    public string ServiceType { get; set; } = string.Empty;

    [StringLength(1000)]
    public string Description { get; set; } = string.Empty;

    [Required]
    public DateTime ScheduledDate { get; set; }

    [Range(0, double.MaxValue)]
    public decimal MileageAtService { get; set; }

    [StringLength(50)]
    public string Status { get; set; } = "Scheduled";

    public string? Notes { get; set; }
}
