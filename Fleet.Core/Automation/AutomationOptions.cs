namespace Fleet.Core.Automation;

/// <summary>
/// Configurable thresholds and toggles for the fleet automation worker.
/// Bound from the "Automation" section of appsettings.json.
/// </summary>
public class AutomationOptions
{
    public const string SectionName = "Automation";

    /// <summary>Master switch for all automated alerts.</summary>
    public bool Enabled { get; set; } = true;

    /// <summary>How often the worker evaluates rules, in minutes.</summary>
    public int PollIntervalMinutes { get; set; } = 60;

    /// <summary>A scheduled service is considered "due soon" within this many days.</summary>
    public int ServiceDueWithinDays { get; set; } = 7;

    /// <summary>Enable the service-due reminder rule.</summary>
    public bool ServiceDueAlertsEnabled { get; set; } = true;

    /// <summary>Enable the critical-fault alert rule.</summary>
    public bool CriticalFaultAlertsEnabled { get; set; } = true;

    /// <summary>A compliance document is considered "expiring soon" within this many days.</summary>
    public int DocumentExpiryWithinDays { get; set; } = 30;

    /// <summary>Enable the compliance-document expiry alert rule.</summary>
    public bool DocumentExpiryAlertsEnabled { get; set; } = true;

    /// <summary>
    /// Fallback recipient used when no fleet manager / tenant admin can be resolved
    /// and the tenant has no contact email. Optional.
    /// </summary>
    public string? FallbackRecipient { get; set; }
}
