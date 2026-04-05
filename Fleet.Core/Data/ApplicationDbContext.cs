using Fleet.Core.Domain;
using Fleet.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Fleet.Core.Data;

/// <summary>
/// Application DbContext with multi-tenant support
/// Automatically filters all queries by TenantId using Global Query Filters
/// Automatically sets TenantId on entity creation
/// </summary>
public class ApplicationDbContext : DbContext
{
    private readonly ITenantService? _tenantService;

    // Constructor for runtime use (with DI)
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options, ITenantService tenantService)
        : base(options)
    {
        _tenantService = tenantService;
    }

    // Constructor for migrations and design-time (without TenantService)
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
        _tenantService = null;
    }

    public DbSet<Tenant> Tenants { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<Role> Roles { get; set; }
    public DbSet<Domain.Fleet> Fleets { get; set; }
    public DbSet<Vehicle> Vehicles { get; set; }
    public DbSet<Manufacturer> Manufacturers { get; set; }
    public DbSet<ServiceSchedule> ServiceSchedules { get; set; }
    public DbSet<Fault> Faults { get; set; }
    public DbSet<JobCard> JobCards { get; set; }
    public DbSet<JobCardTask> JobCardTasks { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Tenant configuration
        modelBuilder.Entity<Tenant>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.ContactEmail).IsRequired().HasMaxLength(200);
            entity.Property(e => e.ContactPhone).HasMaxLength(50);
            entity.HasIndex(e => e.Name);
        });

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Username).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(200);
            entity.Property(e => e.PasswordHash).IsRequired();
            entity.Property(e => e.FirstName).HasMaxLength(100);
            entity.Property(e => e.LastName).HasMaxLength(100);

            entity.HasIndex(e => e.Username).IsUnique();
            entity.HasIndex(e => e.Email).IsUnique();

            entity.HasOne(e => e.Tenant)
                .WithMany(t => t.Users)
                .HasForeignKey(e => e.TenantId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.Roles)
                .WithMany(r => r.Users)
                .UsingEntity(j => j.ToTable("UserRoles"));
        });

        // Role configuration
        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.HasIndex(e => e.Name).IsUnique();
        });

        // Fleet configuration
        modelBuilder.Entity<Domain.Fleet>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.Location).HasMaxLength(500);

            entity.HasOne(e => e.Tenant)
                .WithMany(t => t.Fleets)
                .HasForeignKey(e => e.TenantId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Manufacturer configuration
        modelBuilder.Entity<Manufacturer>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Country).HasMaxLength(100);
            entity.Property(e => e.Website).HasMaxLength(500);
            entity.HasIndex(e => e.Name);
        });

        // Vehicle configuration
        modelBuilder.Entity<Vehicle>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.RegistrationNumber).IsRequired().HasMaxLength(50);
            entity.Property(e => e.VIN).IsRequired().HasMaxLength(17);
            entity.Property(e => e.Model).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Color).HasMaxLength(50);
            entity.Property(e => e.Status).HasMaxLength(50);
            entity.Property(e => e.Mileage).HasColumnType("decimal(18,2)");

            entity.HasIndex(e => e.RegistrationNumber).IsUnique();
            entity.HasIndex(e => e.VIN).IsUnique();

            entity.HasOne(e => e.Fleet)
                .WithMany(f => f.Vehicles)
                .HasForeignKey(e => e.FleetId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Manufacturer)
                .WithMany(m => m.Vehicles)
                .HasForeignKey(e => e.ManufacturerId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ServiceSchedule configuration
        modelBuilder.Entity<ServiceSchedule>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ServiceType).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.Status).HasMaxLength(50);
            entity.Property(e => e.MileageAtService).HasColumnType("decimal(18,2)");
            entity.Property(e => e.Notes).HasMaxLength(2000);

            entity.HasOne(e => e.Vehicle)
                .WithMany(v => v.ServiceSchedules)
                .HasForeignKey(e => e.VehicleId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Fault configuration
        modelBuilder.Entity<Fault>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(2000);
            entity.Property(e => e.Severity).HasMaxLength(50);
            entity.Property(e => e.Status).HasMaxLength(50);

            entity.HasOne(e => e.Vehicle)
                .WithMany(v => v.Faults)
                .HasForeignKey(e => e.VehicleId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // JobCard configuration
        modelBuilder.Entity<JobCard>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.JobNumber).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(2000);
            entity.Property(e => e.Priority).HasMaxLength(50);
            entity.Property(e => e.Status).HasMaxLength(50);
            entity.Property(e => e.EstimatedCost).HasColumnType("decimal(18,2)");
            entity.Property(e => e.ActualCost).HasColumnType("decimal(18,2)");

            entity.HasIndex(e => e.JobNumber).IsUnique();

            entity.HasOne(e => e.Vehicle)
                .WithMany(v => v.JobCards)
                .HasForeignKey(e => e.VehicleId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Fault)
                .WithMany(f => f.JobCards)
                .HasForeignKey(e => e.FaultId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.AssignedTo)
                .WithMany(u => u.AssignedJobCards)
                .HasForeignKey(e => e.AssignedToUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // JobCardTask configuration
        modelBuilder.Entity<JobCardTask>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TaskName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.Notes).HasMaxLength(2000);

            entity.HasOne(e => e.JobCard)
                .WithMany(j => j.Tasks)
                .HasForeignKey(e => e.JobCardId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ===================================================================
        // MULTI-TENANT GLOBAL QUERY FILTERS
        // ===================================================================
        // Automatically filter all tenant-aware entities by TenantId
        // This ensures complete data isolation between tenants
        // Filters are applied to ALL queries automatically by EF Core
        // ===================================================================

        // Get current tenant ID from TenantService
        var tenantId = _tenantService?.GetTenantId();

        // Apply global filter to Fleet
        modelBuilder.Entity<Domain.Fleet>()
            .HasQueryFilter(e => tenantId == null || e.TenantId == tenantId.Value);

        // Apply global filter to Vehicle
        modelBuilder.Entity<Vehicle>()
            .HasQueryFilter(e => tenantId == null || e.TenantId == tenantId.Value);

        // Apply global filter to JobCard
        modelBuilder.Entity<JobCard>()
            .HasQueryFilter(e => tenantId == null || e.TenantId == tenantId.Value);

        // Apply global filter to Fault
        // Apply global filter to Fault
        modelBuilder.Entity<Fault>()
            .HasQueryFilter(e => tenantId == null || e.TenantId == tenantId.Value);

        // Apply global filter to ServiceSchedule
        modelBuilder.Entity<ServiceSchedule>()
            .HasQueryFilter(e => tenantId == null || e.TenantId == tenantId.Value);
    }

    /// <summary>
    /// Override SaveChangesAsync to automatically set TenantId on new entities
    /// This ensures all new entities are automatically associated with the current tenant
    /// Special handling for System Admins who can manage multiple tenants
    /// </summary>
    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // Get current tenant ID (null for System Admins)
        var tenantId = _tenantService?.GetTenantId();

        // Process all added entities
        foreach (var entry in ChangeTracker.Entries<ITenantEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                // Only set TenantId if it hasn't been set already
                if (entry.Entity.TenantId == 0)
                {
                    if (tenantId.HasValue)
                    {
                        // Regular user - auto-assign their TenantId
                        entry.Entity.TenantId = tenantId.Value;
                    }
                    else
                    {
                        // System Admin or unauthenticated - require TenantId to be set manually
                        throw new InvalidOperationException(
                            $"Cannot create {entry.Entity.GetType().Name} without TenantId. " +
                            "System Admins must explicitly set TenantId when creating entities.");
                    }
                }
                // For System Admins (tenantId is null), allow creating entities for any tenant
                // For regular users, verify they're not trying to create data for a different tenant
                else if (tenantId.HasValue && entry.Entity.TenantId != tenantId.Value)
                {
                    throw new UnauthorizedAccessException(
                        $"Cannot create {entry.Entity.GetType().Name} for a different tenant. " +
                        "Cross-tenant data manipulation is not allowed.");
                }
                // If tenantId is null (System Admin), allow any TenantId - no validation needed
            }
            else if (entry.State == EntityState.Modified)
            {
                // Prevent changing TenantId after creation
                var originalTenantId = (int)entry.OriginalValues[nameof(ITenantEntity.TenantId)];
                if (entry.Entity.TenantId != originalTenantId)
                {
                    throw new InvalidOperationException(
                        $"Cannot change TenantId for {entry.Entity.GetType().Name}. " +
                        "TenantId is immutable after creation.");
                }
                
                // For System Admins (tenantId is null), allow modifying entities from any tenant
                // For regular users, verify they're not trying to modify entities from other tenants
                if (tenantId.HasValue && entry.Entity.TenantId != tenantId.Value)
                {
                    throw new UnauthorizedAccessException(
                        $"Cannot modify {entry.Entity.GetType().Name} belonging to a different tenant.");
                }
                // If tenantId is null (System Admin), allow modifying any tenant's data
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }

    /// <summary>
    /// Override SaveChanges (synchronous version)
    /// </summary>
    public override int SaveChanges()
    {
        return SaveChangesAsync().GetAwaiter().GetResult();
    }
}
