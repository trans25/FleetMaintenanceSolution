namespace Fleet.Core.Common;

/// <summary>
/// Canonical status values and allowed transitions for the fleet maintenance
/// lifecycle. Statuses are persisted as strings on the domain entities, so these
/// constants keep values consistent and enable state-machine style validation
/// that mirrors how a real fleet maintenance system behaves.
/// </summary>
public static class MaintenanceStatuses
{
    /// <summary>Vehicle operational status.</summary>
    public static class Vehicle
    {
        public const string Active = "Active";
        public const string InService = "InService";
        public const string OutOfService = "OutOfService";

        public static readonly IReadOnlyDictionary<string, string[]> Transitions =
            new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
            {
                [Active] = new[] { InService, OutOfService },
                [InService] = new[] { Active, OutOfService },
                [OutOfService] = new[] { Active }
            };
    }

    /// <summary>Fault (defect report) status.</summary>
    public static class Fault
    {
        public const string Reported = "Reported";
        public const string InProgress = "InProgress";
        public const string Resolved = "Resolved";
        public const string Closed = "Closed";

        public static readonly IReadOnlyDictionary<string, string[]> Transitions =
            new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
            {
                [Reported] = new[] { InProgress, Closed },
                [InProgress] = new[] { Resolved, Closed },
                [Resolved] = new[] { Closed },
                [Closed] = Array.Empty<string>()
            };
    }

    /// <summary>Job card (work order) status.</summary>
    public static class JobCard
    {
        public const string Open = "Open";
        public const string InProgress = "InProgress";
        public const string Completed = "Completed";
        public const string Cancelled = "Cancelled";

        public static readonly IReadOnlyDictionary<string, string[]> Transitions =
            new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
            {
                [Open] = new[] { InProgress, Cancelled },
                [InProgress] = new[] { Completed, Cancelled },
                [Completed] = Array.Empty<string>(),
                [Cancelled] = Array.Empty<string>()
            };
    }

    /// <summary>Preventive service schedule status.</summary>
    public static class ServiceSchedule
    {
        public const string Scheduled = "Scheduled";
        public const string Completed = "Completed";
        public const string Cancelled = "Cancelled";

        public static readonly IReadOnlyDictionary<string, string[]> Transitions =
            new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
            {
                [Scheduled] = new[] { Completed, Cancelled },
                [Completed] = Array.Empty<string>(),
                [Cancelled] = Array.Empty<string>()
            };
    }

    /// <summary>
    /// Validates that a status change is allowed by the given transition map.
    /// Same-status "changes" are treated as no-ops and allowed. Throws
    /// <see cref="ArgumentException"/> for unknown statuses and
    /// <see cref="InvalidOperationException"/> for disallowed transitions.
    /// </summary>
    public static void EnsureTransitionAllowed(
        IReadOnlyDictionary<string, string[]> transitions,
        string currentStatus,
        string newStatus,
        string entityName)
    {
        if (string.IsNullOrWhiteSpace(newStatus))
            throw new ArgumentException($"{entityName} status cannot be empty.");

        if (string.Equals(currentStatus, newStatus, StringComparison.OrdinalIgnoreCase))
            return;

        if (!transitions.ContainsKey(currentStatus))
            throw new ArgumentException($"Unknown {entityName} status '{currentStatus}'.");

        if (!transitions.ContainsKey(newStatus))
            throw new ArgumentException($"Unknown {entityName} status '{newStatus}'.");

        var allowed = transitions[currentStatus];
        if (!allowed.Contains(newStatus, StringComparer.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                $"Cannot change {entityName} status from '{currentStatus}' to '{newStatus}'. " +
                $"Allowed transitions: {(allowed.Length == 0 ? "none" : string.Join(", ", allowed))}.");
        }
    }
}
