using System.Security.Claims;

namespace Fleet.Core.Common;

/// <summary>
/// Helpers for reading identity information from the current principal so
/// controllers can enforce tenant isolation consistently.
/// </summary>
public static class ClaimsPrincipalExtensions
{
    public static int? GetTenantId(this ClaimsPrincipal user)
    {
        var value = user.FindFirst("TenantId")?.Value;
        return int.TryParse(value, out var id) ? id : null;
    }

    public static int? GetUserId(this ClaimsPrincipal user)
    {
        var value = user.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(value, out var id) ? id : null;
    }

    public static bool IsSystemAdmin(this ClaimsPrincipal user)
        => user.IsInRole("SystemAdmin");
}
