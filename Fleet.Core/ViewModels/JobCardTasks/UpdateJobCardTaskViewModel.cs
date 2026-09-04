using System.ComponentModel.DataAnnotations;

namespace Fleet.Core.ViewModels.JobCardTasks;

public class UpdateJobCardTaskViewModel
{
    [Required]
    public int Id { get; set; }

    [Required]
    public int JobCardId { get; set; }

    [Required]
    [StringLength(200)]
    public string TaskName { get; set; } = string.Empty;

    [StringLength(1000)]
    public string Description { get; set; } = string.Empty;

    public bool IsCompleted { get; set; }

    public DateTime? CompletedDate { get; set; }

    public int? CompletedByUserId { get; set; }

    public string? Notes { get; set; }
}
