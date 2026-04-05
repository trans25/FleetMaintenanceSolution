namespace Fleet.Core.Interfaces;

/// <summary>
/// Service for managing tenant context in multi-tenant architecture
/// Extracts and provides TenantId from authenticated user's JWT claims
/// </summary>
public interface ITenantService
{
    /// <summary>
    /// Gets the TenantId of the currently authenticated user from JWT claims
    /// </summary>
    /// <returns>TenantId if user is authenticated, null otherwise</returns>
    int? GetTenantId();

    /// <summary>
    /// Gets the TenantId and throws exception if not authenticated
    /// Use this when tenant context is required
    /// </summary>
    /// <returns>TenantId</returns>
    /// <exception cref="UnauthorizedAccessException">Thrown when user is not authenticated or TenantId is missing</exception>
    int GetRequiredTenantId();

    /// <summary>
    /// Gets the current UserId from JWT claims
    /// </summary>
    /// <returns>UserId if authenticated, null otherwise</returns>
    int? GetUserId();

    /// <summary>
    /// Checks if the current user belongs to the specified tenant
    /// </summary>
    /// <param name="tenantId">Tenant ID to check</param>
    /// <returns>True if user belongs to tenant, false otherwise</returns>
    bool BelongsToTenant(int tenantId);
}
