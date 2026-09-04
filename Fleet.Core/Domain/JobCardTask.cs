namespace Fleet.Core.Domain;

public class JobCardTask : BaseTenantEntity
{
    public int JobCardId { get; set; }
    public string TaskName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsCompleted { get; set; } = false;
    public DateTime? CompletedDate { get; set; }
    public int? CompletedByUserId { get; set; }
    public string? Notes { get; set; }

    // Navigation properties
    public JobCard JobCard { get; set; } = null!;
}
