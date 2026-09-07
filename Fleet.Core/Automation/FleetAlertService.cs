using Fleet.Core.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Fleet.Core.Automation;

public class FleetAlertService : IFleetAlertService
{
    private readonly ApplicationDbContext _db;
    private readonly INotificationService _notifications;
    private readonly AutomationOptions _options;
    private readonly ILogger<FleetAlertService> _logger;

    private static readonly string[] CriticalSeverities = { "High", "Critical" };
    private static readonly string[] OpenFaultStatuses = { "Reported", "InProgress" };

    public FleetAlertService(
        ApplicationDbContext db,
        INotificationService notifications,
        IOptions<AutomationOptions> options,
        ILogger<FleetAlertService> logger)
    {
        _db = db;
        _notifications = notifications;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<int> RunOnceAsync(CancellationToken cancellationToken = default)
    {
        if (!_options.Enabled)
        {
            _logger.LogInformation("Automation is disabled; skipping cycle.");
            return 0;
        }

        var sent = 0;
        if (_options.ServiceDueAlertsEnabled)
        {
            sent += await EvaluateServiceDueAsync(cancellationToken);
        }
        if (_options.CriticalFaultAlertsEnabled)
        {
            sent += await EvaluateCriticalFaultsAsync(cancellationToken);
        }

        if (_options.DocumentExpiryAlertsEnabled)
        {
            sent += await EvaluateDocumentExpiryAsync(cancellationToken);
        }

        _logger.LogInformation("Automation cycle complete. {Count} new notification(s) sent.", sent);
        return sent;
    }

    private async Task<int> EvaluateServiceDueAsync(CancellationToken ct)
    {
        var today = DateTime.UtcNow.Date;
        var cutoff = today.AddDays(_options.ServiceDueWithinDays);

        var due = await _db.ServiceSchedules
            .Where(s => s.Status == "Scheduled"
                        && s.ScheduledDate.Date >= today
                        && s.ScheduledDate.Date <= cutoff)
            .Select(s => new
            {
                s.Id,
                s.TenantId,
                s.ServiceType,
                s.ScheduledDate,
                Registration = s.Vehicle.RegistrationNumber,
                Model = s.Vehicle.Model
            })
            .ToListAsync(ct);

        var sent = 0;
        foreach (var s in due)
        {
            var recipients = await _notifications.ResolveTenantRecipientsAsync(s.TenantId, ct);
            var daysLeft = (s.ScheduledDate.Date - today).Days;
            var subject = $"[Fleet Alert] Service due in {daysLeft} day(s): {s.Registration}";
            var body =
                $"Vehicle {s.Registration} ({s.Model}) is due for '{s.ServiceType}' on " +
                $"{s.ScheduledDate:yyyy-MM-dd} ({daysLeft} day(s) away).\n\n" +
                "Please schedule the workshop booking in the Fleet Maintenance system.";
            var dedupeKey = $"ServiceDue:{s.Id}:{s.ScheduledDate:yyyy-MM-dd}";

            foreach (var recipient in recipients)
            {
                if (await _notifications.SendIfNewAsync(
                        s.TenantId, "ServiceDue", "ServiceSchedule", s.Id,
                        $"{dedupeKey}:{recipient}", recipient, subject, body, ct))
                {
                    sent++;
                }
            }
        }

        return sent;
    }

    private async Task<int> EvaluateCriticalFaultsAsync(CancellationToken ct)
    {
        var faults = await _db.Faults
            .Where(f => CriticalSeverities.Contains(f.Severity)
                        && OpenFaultStatuses.Contains(f.Status))
            .Select(f => new
            {
                f.Id,
                f.TenantId,
                f.Title,
                f.Severity,
                f.ReportedDate,
                Registration = f.Vehicle.RegistrationNumber,
                Model = f.Vehicle.Model
            })
            .ToListAsync(ct);

        var sent = 0;
        foreach (var f in faults)
        {
            var recipients = await _notifications.ResolveTenantRecipientsAsync(f.TenantId, ct);
            var subject = $"[Fleet Alert] {f.Severity} fault: {f.Registration} - {f.Title}";
            var body =
                $"A {f.Severity.ToUpperInvariant()} fault has been reported on vehicle " +
                $"{f.Registration} ({f.Model}).\n\n" +
                $"Fault: {f.Title}\nReported: {f.ReportedDate:yyyy-MM-dd HH:mm} UTC\n\n" +
                "Review and raise a job card in the Fleet Maintenance system.";
            // One alert per fault (not per status change) keeps noise low.
            var dedupeKey = $"CriticalFault:{f.Id}";

            foreach (var recipient in recipients)
            {
                if (await _notifications.SendIfNewAsync(
                        f.TenantId, "CriticalFault", "Fault", f.Id,
                        $"{dedupeKey}:{recipient}", recipient, subject, body, ct))
                {
                    sent++;
                }
            }
        }

        return sent;
    }

    private async Task<int> EvaluateDocumentExpiryAsync(CancellationToken ct)
    {
        var today = DateTime.UtcNow.Date;
        var cutoff = today.AddDays(_options.DocumentExpiryWithinDays);

        // Documents already expired or expiring within the configured window.
        var documents = await _db.ComplianceDocuments
            .Where(d => d.ExpiryDate.Date <= cutoff)
            .Select(d => new
            {
                d.Id,
                d.TenantId,
                d.Name,
                d.DocumentType,
                d.ExpiryDate,
                Registration = d.Vehicle.RegistrationNumber,
                Model = d.Vehicle.Model
            })
            .ToListAsync(ct);

        var sent = 0;
        foreach (var d in documents)
        {
            var recipients = await _notifications.ResolveTenantRecipientsAsync(d.TenantId, ct);
            var daysLeft = (d.ExpiryDate.Date - today).Days;
            var expired = daysLeft < 0;

            var subject = expired
                ? $"[Fleet Alert] Document EXPIRED: {d.Registration} - {d.Name}"
                : $"[Fleet Alert] Document expiring in {daysLeft} day(s): {d.Registration} - {d.Name}";
            var body =
                $"Compliance document '{d.Name}' ({d.DocumentType}) for vehicle " +
                $"{d.Registration} ({d.Model}) " +
                (expired
                    ? $"expired on {d.ExpiryDate:yyyy-MM-dd}.\n\n"
                    : $"expires on {d.ExpiryDate:yyyy-MM-dd} ({daysLeft} day(s) away).\n\n") +
                "Please renew the document in the Fleet Maintenance system.";

            // Re-alert once per expiry date so renewals reset the notification.
            var dedupeKey = $"DocumentExpiry:{d.Id}:{d.ExpiryDate:yyyy-MM-dd}";

            foreach (var recipient in recipients)
            {
                if (await _notifications.SendIfNewAsync(
                        d.TenantId, "DocumentExpiry", "ComplianceDocument", d.Id,
                        $"{dedupeKey}:{recipient}", recipient, subject, body, ct))
                {
                    sent++;
                }
            }
        }

        return sent;
    }
}
