using System.ComponentModel.DataAnnotations;

namespace Fleet.Core.ViewModels.Faults;

public class CreateFaultViewModel
{
    [Required]
    public int VehicleId { get; set; }

    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    [StringLength(1000)]
    public string Description { get; set; } = string.Empty;

    [StringLength(50)]
    public string Severity { get; set; } = "Medium";

    [StringLength(50)]
    public string Status { get; set; } = "Reported";

    public int? ReportedByUserId { get; set; }
}
