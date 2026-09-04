using System.ComponentModel.DataAnnotations;

namespace Fleet.Core.ViewModels.JobCardTasks;

public class CreateJobCardTaskViewModel
{
    [Required]
    public int JobCardId { get; set; }

    [Required]
    [StringLength(200)]
    public string TaskName { get; set; } = string.Empty;

    [StringLength(1000)]
    public string Description { get; set; } = string.Empty;

    public bool IsCompleted { get; set; } = false;

    public string? Notes { get; set; }
}
