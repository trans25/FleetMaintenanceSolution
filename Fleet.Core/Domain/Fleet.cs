using Fleet.Core.Interfaces;

namespace Fleet.Core.Domain;

/// <summary>
/// Fleet entity with multi-tenant support
/// </summary>
public class Fleet : ITenantEntity
{
    public int Id { get; set; }
    
    /// <summary>
    /// Tenant ID for multi-tenant data isolation
    /// </summary>
    public int TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public Tenant Tenant { get; set; } = null!;
    public ICollection<Vehicle> Vehicles { get; set; } = new List<Vehicle>();
}
