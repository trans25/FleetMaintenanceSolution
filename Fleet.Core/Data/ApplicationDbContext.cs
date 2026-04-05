using Fleet.Core.Domain;
using Microsoft.EntityFrameworkCore;

namespace Fleet.Core.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
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
                .OnDelete(DeleteBehavior.Restrict);

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
                .OnDelete(DeleteBehavior.Restrict);
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
                .OnDelete(DeleteBehavior.Restrict);

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

        // Seed data for roles - Fleet Maintenance Role-Permission Matrix
        modelBuilder.Entity<Role>().HasData(
            new Role { Id = 1, Name = "SystemAdmin", Description = "System Administrator - Full control over all tenants", CreatedAt = DateTime.UtcNow },
            new Role { Id = 2, Name = "TenantAdmin", Description = "Tenant Administrator - Full control within own tenant", CreatedAt = DateTime.UtcNow },
            new Role { Id = 3, Name = "FleetManager", Description = "Fleet Manager - Manage fleets, assign vehicles, schedules, and job cards", CreatedAt = DateTime.UtcNow },
            new Role { Id = 4, Name = "Technician", Description = "Technician/Mechanic - Update task status, service updates on assigned jobs", CreatedAt = DateTime.UtcNow },
            new Role { Id = 5, Name = "Staff", Description = "Staff/User - Create service requests or tickets, view assigned jobs", CreatedAt = DateTime.UtcNow },
            new Role { Id = 6, Name = "Auditor", Description = "Auditor/Read-Only - View reports, logs, and fleet data for auditing", CreatedAt = DateTime.UtcNow },
            new Role { Id = 7, Name = "Guest", Description = "Guest/Limited User - View only general info and public dashboards", CreatedAt = DateTime.UtcNow }
        );
    }
}
