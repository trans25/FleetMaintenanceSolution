using Fleet.Core.Common;
using Fleet.Core.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Fleet.API.Controllers;

/// <summary>
/// Read-only access to automation notifications/alerts. SystemAdmins see all tenants;
/// other users see only their own tenant's notifications.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public NotificationsController(ApplicationDbContext db)
    {
        _db = db;
    }

    public class NotificationListViewModel
    {
        public int Id { get; set; }
        public int TenantId { get; set; }
        public string Type { get; set; } = string.Empty;
        public string EntityType { get; set; } = string.Empty;
        public int EntityId { get; set; }
        public string Channel { get; set; } = string.Empty;
        public string Recipient { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? Error { get; set; }
        public DateTime SentAt { get; set; }
    }

    [HttpGet]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<IEnumerable<NotificationListViewModel>>> GetAll()
    {
        var query = _db.Notifications.AsNoTracking().AsQueryable();

        if (!User.IsSystemAdmin())
        {
            var tenantId = User.GetTenantId();
            if (tenantId is null)
                return Ok(Enumerable.Empty<NotificationListViewModel>());
            query = query.Where(n => n.TenantId == tenantId.Value);
        }

        var notifications = await query
            .OrderByDescending(n => n.SentAt)
            .Take(500)
            .Select(n => new NotificationListViewModel
            {
                Id = n.Id,
                TenantId = n.TenantId,
                Type = n.Type,
                EntityType = n.EntityType,
                EntityId = n.EntityId,
                Channel = n.Channel,
                Recipient = n.Recipient,
                Subject = n.Subject,
                Body = n.Body,
                Status = n.Status,
                Error = n.Error,
                SentAt = n.SentAt
            })
            .ToListAsync();

        return Ok(notifications);
    }
}
