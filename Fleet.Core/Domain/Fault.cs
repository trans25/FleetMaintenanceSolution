using Fleet.Core.Interfaces;

namespace Fleet.Core.Domain;

/// <summary>
/// Fault entity with multi-tenant support
/// </summary>
public class Fault : ITenantEntity
{
    public int Id { get; set; }
    
    /// <summary>
    /// Tenant ID for multi-tenant data isolation
    /// </summary>
    public int TenantId { get; set; }
    
    public int VehicleId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Severity { get; set; } = "Medium"; // Low, Medium, High, Critical
    public string Status { get; set; } = "Reported"; // Reported, InProgress, Resolved, Closed
    public DateTime ReportedDate { get; set; } = DateTime.UtcNow;
    public DateTime? ResolvedDate { get; set; }
    public int? ReportedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public Vehicle Vehicle { get; set; } = null!;
    public ICollection<JobCard> JobCards { get; set; } = new List<JobCard>();
}
