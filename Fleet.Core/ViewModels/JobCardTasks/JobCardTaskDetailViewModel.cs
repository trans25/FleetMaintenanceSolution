namespace Fleet.Core.ViewModels.JobCardTasks;

public class JobCardTaskDetailViewModel
{
    public int Id { get; set; }
    public int JobCardId { get; set; }
    public string TaskName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsCompleted { get; set; }
    public DateTime? CompletedDate { get; set; }
    public int? CompletedByUserId { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
