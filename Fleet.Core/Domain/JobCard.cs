using Fleet.Core.Interfaces;

namespace Fleet.Core.Domain;

/// <summary>
/// JobCard entity with multi-tenant support
/// </summary>
public class JobCard : ITenantEntity
{
    public int Id { get; set; }
    
    /// <summary>
    /// Tenant ID for multi-tenant data isolation
    /// </summary>
    public int TenantId { get; set; }
    
    public int VehicleId { get; set; }
    public int? FaultId { get; set; }
    public string JobNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Priority { get; set; } = "Medium"; // Low, Medium, High, Urgent
    public string Status { get; set; } = "Open"; // Open, InProgress, Completed, Cancelled
    public int? AssignedToUserId { get; set; }
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    public DateTime? StartDate { get; set; }
    public DateTime? CompletedDate { get; set; }
    public decimal EstimatedCost { get; set; }
    public decimal? ActualCost { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public Vehicle Vehicle { get; set; } = null!;
    public Fault? Fault { get; set; }
    public User? AssignedTo { get; set; }
    public ICollection<JobCardTask> Tasks { get; set; } = new List<JobCardTask>();
}
