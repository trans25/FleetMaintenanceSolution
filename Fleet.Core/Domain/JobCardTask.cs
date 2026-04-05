namespace Fleet.Core.Domain;

public class JobCardTask
{
    public int Id { get; set; }
    public int JobCardId { get; set; }
    public string TaskName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsCompleted { get; set; } = false;
    public DateTime? CompletedDate { get; set; }
    public int? CompletedByUserId { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public JobCard JobCard { get; set; } = null!;
}
