using Fleet.Core.Interfaces;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Fleet.Core.Services;

/// <summary>
/// Implementation of ITenantService
/// Extracts tenant context from HTTP request using IHttpContextAccessor
/// Special handling: System Admins bypass tenant filtering to see all data
/// </summary>
public class TenantService : ITenantService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public TenantService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    /// <summary>
    /// Gets the TenantId from JWT claims
    /// Returns NULL for System Admins to bypass tenant filtering (allows access to all tenants)
    /// </summary>
    public int? GetTenantId()
    {
        var user = _httpContextAccessor.HttpContext?.User;
        
        if (user == null || !user.Identity?.IsAuthenticated == true)
            return null;

        // CHECK: If user is System Admin, return null to bypass tenant filtering
        // This allows System Admins to see and manage data across ALL tenants
        var isSystemAdmin = user.IsInRole("SystemAdmin");
        if (isSystemAdmin)
        {
            return null; // Bypasses tenant filter - returns all data
        }

        // For non-admin users, extract TenantId from JWT claims
        var tenantIdClaim = user.FindFirst("TenantId")?.Value;
        
        if (string.IsNullOrEmpty(tenantIdClaim))
            return null;

        return int.TryParse(tenantIdClaim, out var tenantId) ? tenantId : null;
    }

    /// <summary>
    /// Gets the TenantId and throws exception if not found
    /// Use this in repositories and services where tenant context is mandatory
    /// </summary>
    public int GetRequiredTenantId()
    {
        var tenantId = GetTenantId();
        
        if (tenantId == null)
        {
            throw new UnauthorizedAccessException("Tenant context is required but not found. User may not be authenticated or TenantId claim is missing.");
        }

        return tenantId.Value;
    }

    /// <summary>
    /// Gets the UserId from JWT claims
    /// </summary>
    public int? GetUserId()
    {
        var userIdClaim = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userIdClaim))
            return null;

        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    /// <summary>
    /// Checks if current user belongs to specified tenant
    /// Prevents cross-tenant data access
    /// </summary>
    public bool BelongsToTenant(int tenantId)
    {
        var currentTenantId = GetTenantId();
        return currentTenantId.HasValue && currentTenantId.Value == tenantId;
    }
}
