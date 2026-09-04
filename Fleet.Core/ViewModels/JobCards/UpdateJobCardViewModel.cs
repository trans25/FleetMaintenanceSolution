using System.ComponentModel.DataAnnotations;

namespace Fleet.Core.ViewModels.JobCards;

public class UpdateJobCardViewModel
{
    [Required]
    public int Id { get; set; }

    [Required]
    public int VehicleId { get; set; }

    public int? FaultId { get; set; }

    [Required]
    [StringLength(50)]
    public string JobNumber { get; set; } = string.Empty;

    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    [StringLength(1000)]
    public string Description { get; set; } = string.Empty;

    [StringLength(50)]
    public string Priority { get; set; } = "Medium";

    [StringLength(50)]
    public string Status { get; set; } = "Open";

    public int? AssignedToUserId { get; set; }

    public DateTime? StartDate { get; set; }

    public DateTime? CompletedDate { get; set; }

    [Range(0, double.MaxValue)]
    public decimal EstimatedCost { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? ActualCost { get; set; }
}
