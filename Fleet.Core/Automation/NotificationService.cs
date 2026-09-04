using Fleet.Core.Common;
using Fleet.Core.Data;
using Fleet.Core.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Fleet.Core.Automation;

public class NotificationService : INotificationService
{
    private readonly ApplicationDbContext _db;
    private readonly IEmailSender _emailSender;
    private readonly AutomationOptions _options;
    private readonly ILogger<NotificationService> _logger;

    private static readonly string[] RecipientRoles = { "FleetManager", "TenantAdmin" };

    public NotificationService(
        ApplicationDbContext db,
        IEmailSender emailSender,
        IOptions<AutomationOptions> options,
        ILogger<NotificationService> logger)
    {
        _db = db;
        _emailSender = emailSender;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<bool> SendIfNewAsync(
        int tenantId,
        string type,
        string entityType,
        int entityId,
        string dedupeKey,
        string recipient,
        string subject,
        string body,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(recipient))
        {
            _logger.LogWarning("No recipient for {Type} alert (entity {EntityType}:{EntityId}); skipping.",
                type, entityType, entityId);
            return false;
        }

        var alreadySent = await _db.Notifications
            .AnyAsync(n => n.DedupeKey == dedupeKey, cancellationToken);
        if (alreadySent)
        {
            return false;
        }

        var notification = new Notification
        {
            TenantId = tenantId,
            Type = type,
            EntityType = entityType,
            EntityId = entityId,
            DedupeKey = dedupeKey,
            Channel = "Email",
            Recipient = recipient,
            Subject = subject,
            Body = body,
            SentAt = DateTime.UtcNow,
            Status = "Sent"
        };

        try
        {
            await _emailSender.SendAsync(recipient, subject, body, cancellationToken);
        }
        catch (Exception ex)
        {
            notification.Status = "Failed";
            notification.Error = ex.Message;
            _logger.LogError(ex, "Failed to send {Type} alert to {Recipient}.", type, recipient);
        }

        _db.Notifications.Add(notification);
        try
        {
            await _db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            // A concurrent worker cycle inserted the same dedupe key first; treat as no-op.
            _db.Entry(notification).State = EntityState.Detached;
            return false;
        }

        return notification.Status == "Sent";
    }

    public async Task<IReadOnlyList<string>> ResolveTenantRecipientsAsync(
        int tenantId, CancellationToken cancellationToken = default)
    {
        var emails = await _db.Users
            .Where(u => u.TenantId == tenantId
                        && u.IsActive
                        && u.Roles.Any(r => RecipientRoles.Contains(r.Name)))
            .Select(u => u.Email)
            .Distinct()
            .ToListAsync(cancellationToken);

        if (emails.Count == 0)
        {
            var contactEmail = await _db.Tenants
                .Where(t => t.Id == tenantId)
                .Select(t => t.ContactEmail)
                .FirstOrDefaultAsync(cancellationToken);

            if (!string.IsNullOrWhiteSpace(contactEmail))
            {
                emails.Add(contactEmail);
            }
            else if (!string.IsNullOrWhiteSpace(_options.FallbackRecipient))
            {
                emails.Add(_options.FallbackRecipient);
            }
        }

        return emails;
    }
}
