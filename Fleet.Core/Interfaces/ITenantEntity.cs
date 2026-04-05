namespace Fleet.Core.Interfaces;

/// <summary>
/// Base interface for all entities that belong to a tenant
/// Ensures multi-tenant isolation at entity level
/// </summary>
public interface ITenantEntity
{
    /// <summary>
    /// The ID of the tenant that owns this entity
    /// All queries will be automatically filtered by this property
    /// </summary>
    int TenantId { get; set; }
}
