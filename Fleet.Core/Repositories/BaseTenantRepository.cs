using Fleet.Core.Data;
using Fleet.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Fleet.Core.Repositories;

/// <summary>
/// Tenant-aware base repository for entities that implement ITenantEntity
/// Automatically filters all queries by current user's TenantId
/// Provides safe CRUD operations with multi-tenant isolation

/// </summary>
/// <typeparam name="T">Entity type that implements ITenantEntity</typeparam>
public class BaseTenantRepository<T> : IRepository<T> where T : class, ITenantEntity
{
    protected readonly ApplicationDbContext _context;
    protected readonly DbSet<T> _dbSet;
    protected readonly ITenantService _tenantService;

    public BaseTenantRepository(ApplicationDbContext context, ITenantService tenantService)
    {
        _context = context;
        _dbSet = context.Set<T>();
        _tenantService = tenantService;
    }

    /// <summary>
    /// Gets all entities for current tenant
    /// Global query filter automatically applies TenantId filter
    /// </summary>
    public virtual async Task<IEnumerable<T>> GetAllAsync()
    {
        // Global query filter will automatically filter by TenantId
        return await _dbSet.ToListAsync();
    }

    /// <summary>
    /// Gets entity by ID for current tenant only
    /// Returns null if entity doesn't exist or belongs to different tenant
    /// </summary>
    public virtual async Task<T?> GetByIdAsync(int id)
    {
        // Global query filter ensures we can only get entities from current tenant
        return await _dbSet.FindAsync(id);
    }

    /// <summary>
    /// Adds new entity
    /// TenantId is automatically set in DbContext.SaveChangesAsync
    /// </summary>
    public virtual async Task<T> AddAsync(T entity)
    {
        // TenantId will be automatically set by ApplicationDbContext.SaveChangesAsync
        await _dbSet.AddAsync(entity);
        await _context.SaveChangesAsync();
        return entity;
    }

    /// <summary>
    /// Updates existing entity
    /// Ensures entity belongs to current tenant (enforced in DbContext.SaveChangesAsync)
    /// </summary>
    public virtual async Task<T> UpdateAsync(T entity)
    {
        // SaveChangesAsync will verify user can't modify entities from other tenants
        _dbSet.Update(entity);
        await _context.SaveChangesAsync();
        return entity;
    }

    /// <summary>
    /// Deletes entity by ID
    /// Only deletes if entity belongs to current tenant
    /// </summary>
    public virtual async Task<bool> DeleteAsync(int id)
    {
        var entity = await GetByIdAsync(id);
        if (entity == null)
            return false; // Entity doesn't exist or belongs to different tenant

        _dbSet.Remove(entity);
        await _context.SaveChangesAsync();
        return true;
    }

    /// <summary>
    /// Gets queryable for advanced filtering
    /// Already filtered by TenantId through global query filter
    /// </summary>
    /// <returns>IQueryable with tenant filter applied</returns>
    protected IQueryable<T> GetQueryable()
    {
        return _dbSet.AsQueryable();
    }

    /// <summary>
    /// Verifies that an entity belongs to the current tenant
    /// Useful for additional security checks
    /// </summary>
    protected bool BelongsToCurrentTenant(T entity)
    {
        var currentTenantId = _tenantService.GetTenantId();
        return currentTenantId.HasValue && entity.TenantId == currentTenantId.Value;
    }
}
