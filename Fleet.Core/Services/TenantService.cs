using Fleet.Core.Data;
using Fleet.Core.Domain;
using Fleet.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Fleet.Core.Services;

public class TenantService : ITenantService
{
    private readonly ITenantRepository _tenantRepository;
    private readonly ApplicationDbContext _context;

    public TenantService(ITenantRepository tenantRepository, ApplicationDbContext context)
    {
        _tenantRepository = tenantRepository;
        _context = context;
    }

    public async Task<IEnumerable<Tenant>> GetAllTenantsAsync()
    {
        return await _tenantRepository.GetAllAsync();
    }

    public async Task<Tenant?> GetTenantByIdAsync(int id)
    {
        return await _tenantRepository.GetByIdAsync(id);
    }

    public async Task<Tenant?> GetTenantByNameAsync(string name)
    {
        return await _tenantRepository.GetByNameAsync(name);
    }

    public async Task<IEnumerable<Tenant>> GetActiveTenantsAsync()
    {
        return await _tenantRepository.GetActiveTenantsAsync();
    }

    public async Task<Tenant> CreateTenantAsync(Tenant tenant)
    {
        tenant.CreatedAt = DateTime.UtcNow;
        return await _tenantRepository.AddAsync(tenant);
    }

    public async Task<Tenant> UpdateTenantAsync(Tenant tenant)
    {
        tenant.UpdatedAt = DateTime.UtcNow;
        return await _tenantRepository.UpdateAsync(tenant);
    }

    public async Task<bool> DeleteTenantAsync(int id)
    {
        var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.Id == id);
        if (tenant == null)
            return false;

        // Hard delete all tenant-owned data in FK-safe order inside a single transaction.
        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // Child graphs first (respecting Restrict FKs: JobCard->Fault, JobCard->User, Vehicle->Fleet).
            await _context.JobCardTasks.Where(x => x.TenantId == id).ExecuteDeleteAsync();
            await _context.JobCards.Where(x => x.TenantId == id).ExecuteDeleteAsync();
            await _context.Faults.Where(x => x.TenantId == id).ExecuteDeleteAsync();
            await _context.ServiceSchedules.Where(x => x.TenantId == id).ExecuteDeleteAsync();
            await _context.ComplianceDocuments.Where(x => x.TenantId == id).ExecuteDeleteAsync();
            await _context.Vehicles.Where(x => x.TenantId == id).ExecuteDeleteAsync();
            await _context.Fleets.Where(x => x.TenantId == id).ExecuteDeleteAsync();
            await _context.Notifications.Where(x => x.TenantId == id).ExecuteDeleteAsync();

            // Tokens have no TenantId; delete via the tenant's users.
            var userIds = await _context.Users.Where(u => u.TenantId == id).Select(u => u.Id).ToListAsync();
            if (userIds.Count > 0)
            {
                await _context.RefreshTokens.Where(t => userIds.Contains(t.UserId)).ExecuteDeleteAsync();
                await _context.PasswordResetTokens.Where(t => userIds.Contains(t.UserId)).ExecuteDeleteAsync();
            }

            await _context.Users.Where(u => u.TenantId == id).ExecuteDeleteAsync();
            await _context.Tenants.Where(t => t.Id == id).ExecuteDeleteAsync();

            await transaction.CommitAsync();
            return true;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<bool> SuspendTenantAsync(int id)
    {
        var tenant = await _tenantRepository.GetByIdAsync(id);
        if (tenant == null)
            return false;

        tenant.IsActive = false;
        tenant.UpdatedAt = DateTime.UtcNow;
        await _tenantRepository.UpdateAsync(tenant);
        return true;
    }

    public async Task<bool> ActivateTenantAsync(int id)
    {
        var tenant = await _tenantRepository.GetByIdAsync(id);
        if (tenant == null)
            return false;

        tenant.IsActive = true;
        tenant.UpdatedAt = DateTime.UtcNow;
        await _tenantRepository.UpdateAsync(tenant);
        return true;
    }
}
