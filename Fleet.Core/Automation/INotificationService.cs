using Fleet.Core.Domain;

namespace Fleet.Core.Automation;

/// <summary>
/// Handles delivery + audit of automated notifications with built-in de-duplication.
/// </summary>
public interface INotificationService
{
    /// <summary>
    /// Sends a notification unless one with the same <paramref name="dedupeKey"/>
    /// has already been recorded. Returns true if a new notification was sent.
    /// </summary>
    Task<bool> SendIfNewAsync(
        int tenantId,
        string type,
        string entityType,
        int entityId,
        string dedupeKey,
        string recipient,
        string subject,
        string body,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Resolves the email recipients for a tenant: active FleetManager/TenantAdmin
    /// users, falling back to the tenant contact email or the configured fallback.
    /// </summary>
    Task<IReadOnlyList<string>> ResolveTenantRecipientsAsync(
        int tenantId, CancellationToken cancellationToken = default);
}
