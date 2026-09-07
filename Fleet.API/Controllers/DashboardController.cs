using Fleet.Core.Common;
using Fleet.Core.Data;
using Fleet.Core.ViewModels.Dashboard;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Fleet.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public DashboardController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Tenant-scoped operational summary for the signed-in user's tenant.
    /// Used by the Tenant Admin / Fleet Manager dashboards.
    /// </summary>
    [HttpGet("summary")]
    public async Task<ActionResult<TenantDashboardSummary>> GetTenantSummary()
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
            return BadRequest("No tenant context found for the current user.");

        var now = DateTime.UtcNow;
        var complianceThreshold = now.AddDays(30);

        var summary = new TenantDashboardSummary
        {
            Fleets = await _context.Fleets.CountAsync(f => f.TenantId == tenantId),
            Vehicles = await _context.Vehicles.CountAsync(v => v.TenantId == tenantId),
            OpenFaults = await _context.Faults
                .CountAsync(f => f.TenantId == tenantId && f.Status != "Resolved" && f.Status != "Closed"),
            ActiveJobCards = await _context.JobCards
                .CountAsync(j => j.TenantId == tenantId && (j.Status == "Open" || j.Status == "InProgress")),
            ComplianceAlerts = await _context.ComplianceDocuments
                .CountAsync(d => d.TenantId == tenantId && d.ExpiryDate <= complianceThreshold),
            Users = await _context.Users.CountAsync(u => u.TenantId == tenantId)
        };

        return Ok(summary);
    }

    /// <summary>
    /// Platform-wide summary for System Admins (fleets, vehicles and tenant counts across all tenants).
    /// </summary>
    [HttpGet("platform")]
    [Authorize(Policy = "RequireSystemAdmin")]
    public async Task<ActionResult<PlatformDashboardSummary>> GetPlatformSummary()
    {
        var summary = new PlatformDashboardSummary
        {
            Tenants = await _context.Tenants.CountAsync(),
            ActiveTenants = await _context.Tenants.CountAsync(t => t.IsActive),
            SuspendedTenants = await _context.Tenants.CountAsync(t => !t.IsActive),
            Fleets = await _context.Fleets.CountAsync(),
            Vehicles = await _context.Vehicles.CountAsync()
        };

        return Ok(summary);
    }

    /// <summary>
    /// Technician-focused summary: job cards assigned to the current user and
    /// open faults on the tenant, scoped to the signed-in user's tenant.
    /// </summary>
    [HttpGet("my-work")]
    public async Task<ActionResult<TechnicianDashboardSummary>> GetMyWorkSummary()
    {
        var tenantId = User.GetTenantId();
        var userId = User.GetUserId();
        if (tenantId is null || userId is null)
            return BadRequest("No user/tenant context found for the current user.");

        var summary = new TechnicianDashboardSummary
        {
            AssignedJobCards = await _context.JobCards
                .CountAsync(j => j.TenantId == tenantId && j.AssignedToUserId == userId
                    && (j.Status == "Open" || j.Status == "InProgress")),
            OpenFaults = await _context.Faults
                .CountAsync(f => f.TenantId == tenantId && f.Status != "Resolved" && f.Status != "Closed")
        };

        return Ok(summary);
    }
}
