using Fleet.Core.Interfaces;

namespace Fleet.Core.Domain;

/// <summary>
/// Base class for entities that belong to a specific tenant.
/// Adds the <see cref="TenantId"/> used for multi-tenant data isolation.
/// </summary>
public abstract class BaseTenantEntity : BaseEntity, ITenantEntity
{
    /// <summary>
    /// Tenant ID for multi-tenant data isolation.
    /// Filtered by the repositories to keep tenant data separated.
    /// </summary>
    public int TenantId { get; set; }
}
