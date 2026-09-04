namespace Fleet.Core.Domain;

/// <summary>
/// Audit record of an automated alert that was dispatched by the automation worker.
/// Also used to de-duplicate alerts so the same trigger is not notified repeatedly.
/// </summary>
public class Notification : BaseTenantEntity
{
    /// <summary>Alert category, e.g. "ServiceDue" or "CriticalFault".</summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>Domain entity the alert relates to, e.g. "ServiceSchedule" or "Fault".</summary>
    public string EntityType { get; set; } = string.Empty;

    /// <summary>Id of the related domain entity.</summary>
    public int EntityId { get; set; }

    /// <summary>
    /// Stable de-duplication key for a given trigger occurrence
    /// (e.g. "ServiceDue:42:2026-09-18"). A unique index prevents duplicate sends.
    /// </summary>
    public string DedupeKey { get; set; } = string.Empty;

    public string Channel { get; set; } = "Email";
    public string Recipient { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;

    /// <summary>Sent, Failed, or Skipped.</summary>
    public string Status { get; set; } = "Sent";
    public string? Error { get; set; }
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
}
