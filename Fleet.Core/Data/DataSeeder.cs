using Fleet.Core.Domain;
using Fleet.Core.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Fleet.Core.Data;

/// <summary>
/// Idempotent runtime data seeder. Ensures the platform system administrator exists
/// and populates a set of realistic South African fleet tenants with demo data.
/// Every operation checks for existence first, so the seeder is safe to run on every startup.
/// </summary>
public static class DataSeeder
{
    // Default password applied to seeded accounts (demo/dev only).
    private const string DefaultPassword = "Passw0rd!";
    private const string SystemAdminEmail = "mashiaes@gmail.com";

    public static async Task SeedAsync(ApplicationDbContext db, ILogger? logger = null)
    {
        await EnsureSystemAdminAsync(db, logger);
        await EnsureSouthAfricanTenantsAsync(db, logger);
    }

    private static async Task EnsureSystemAdminAsync(ApplicationDbContext db, ILogger? logger)
    {
        var systemAdminRole = await db.Roles.FirstOrDefaultAsync(r => r.Name == "SystemAdmin");
        if (systemAdminRole is null)
        {
            logger?.LogWarning("SystemAdmin role not found; skipping system admin seeding.");
            return;
        }

        var user = await db.Users
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Email == SystemAdminEmail);

        if (user is null)
        {
            user = new User
            {
                Username = SystemAdminEmail,
                Email = SystemAdminEmail,
                FirstName = "Elias",
                LastName = "Mashia",
                PasswordHash = PasswordHasher.Hash(DefaultPassword),
                IsActive = true,
                TenantId = 1, // Default Tenant
                Roles = new List<Role> { systemAdminRole }
            };
            db.Users.Add(user);
            await db.SaveChangesAsync();
            logger?.LogInformation("Created SystemAdmin user {Email}.", SystemAdminEmail);
        }
        else if (!user.Roles.Any(r => r.Name == "SystemAdmin"))
        {
            user.Roles.Add(systemAdminRole);
            user.IsActive = true;
            await db.SaveChangesAsync();
            logger?.LogInformation("Granted SystemAdmin role to existing user {Email}.", SystemAdminEmail);
        }
    }

    private static async Task EnsureSouthAfricanTenantsAsync(ApplicationDbContext db, ILogger? logger)
    {
        var tenantAdminRole = await db.Roles.FirstOrDefaultAsync(r => r.Name == "TenantAdmin");

        foreach (var seed in SouthAfricanTenantSeeds)
        {
            var tenant = await db.Tenants.FirstOrDefaultAsync(t => t.Name == seed.Name);

            // Consider a tenant fully seeded only if it already has vehicles.
            // This lets a previously interrupted (partial) seed be completed on a later run.
            if (tenant is not null &&
                await db.Vehicles.AnyAsync(v => v.TenantId == tenant.Id))
            {
                continue;
            }

            await using var tx = await db.Database.BeginTransactionAsync();
            try
            {
                if (tenant is null)
                {
                    tenant = new Tenant
                    {
                        Name = seed.Name,
                        ContactEmail = seed.ContactEmail,
                        ContactPhone = seed.ContactPhone,
                        IsActive = true
                    };
                    db.Tenants.Add(tenant);
                    await db.SaveChangesAsync();
                }

                // Tenant administrator
                if (tenantAdminRole is not null &&
                    !await db.Users.AnyAsync(u => u.Email == seed.AdminEmail))
                {
                    db.Users.Add(new User
                    {
                        Username = seed.AdminEmail,
                        Email = seed.AdminEmail,
                        FirstName = seed.AdminFirstName,
                        LastName = seed.AdminLastName,
                        PasswordHash = PasswordHasher.Hash(DefaultPassword),
                        IsActive = true,
                        TenantId = tenant.Id,
                        Roles = new List<Role> { tenantAdminRole }
                    });
                    await db.SaveChangesAsync();
                }

                // Fleet (reuse an existing one from a partial run if present)
                var fleet = await db.Fleets.FirstOrDefaultAsync(f => f.TenantId == tenant.Id);
                if (fleet is null)
                {
                    fleet = new Domain.Fleet
                    {
                        Name = seed.FleetName,
                        Description = seed.FleetDescription,
                        Location = seed.Location,
                        IsActive = true,
                        TenantId = tenant.Id
                    };
                    db.Fleets.Add(fleet);
                    await db.SaveChangesAsync();
                }

                // Vehicles
                var addedVehicles = new List<Vehicle>();
                foreach (var v in seed.Vehicles)
                {
                    var manufacturer = await GetOrCreateManufacturerAsync(db, v.Manufacturer, v.ManufacturerCountry);

                    var vehicle = new Vehicle
                    {
                        TenantId = tenant.Id,
                        FleetId = fleet.Id,
                        ManufacturerId = manufacturer.Id,
                        RegistrationNumber = v.Registration,
                        VIN = v.Vin,
                        Model = v.Model,
                        Year = v.Year,
                        Color = v.Color,
                        Mileage = v.Mileage,
                        Status = v.Status,
                        PurchaseDate = v.PurchaseDate,
                        LastServiceDate = v.LastServiceDate
                    };
                    db.Vehicles.Add(vehicle);
                    addedVehicles.Add(vehicle);
                }
                await db.SaveChangesAsync();

                // Operational data on the first couple of vehicles for a realistic dashboard
                SeedOperationalData(db, tenant.Id, addedVehicles);
                await db.SaveChangesAsync();

                await tx.CommitAsync();

                logger?.LogInformation(
                    "Seeded tenant '{Tenant}' with fleet '{Fleet}' and {Count} vehicles.",
                    tenant.Name, fleet.Name, addedVehicles.Count);
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync();
                logger?.LogError(ex, "Failed to seed tenant '{Tenant}'.", seed.Name);
                throw;
            }
        }
    }

    private static void SeedOperationalData(ApplicationDbContext db, int tenantId, List<Vehicle> vehicles)
    {
        if (vehicles.Count == 0)
        {
            return;
        }

        var now = DateTime.UtcNow;

        // Service schedule on the first vehicle
        var v0 = vehicles[0];
        db.ServiceSchedules.Add(new ServiceSchedule
        {
            TenantId = tenantId,
            VehicleId = v0.Id,
            ServiceType = "Scheduled Service",
            Description = "50,000 km major service - oil, filters, brakes inspection",
            ScheduledDate = now.AddDays(14),
            MileageAtService = v0.Mileage + 1500m,
            Status = "Scheduled"
        });

        // Reported fault + resulting job card on the second vehicle (if available)
        var vf = vehicles.Count > 1 ? vehicles[1] : vehicles[0];
        var fault = new Fault
        {
            TenantId = tenantId,
            VehicleId = vf.Id,
            Title = "Brake warning light on",
            Description = "ABS/brake warning illuminated on dashboard during morning route.",
            Severity = "High",
            Status = "InProgress",
            ReportedDate = now.AddDays(-3)
        };
        db.Faults.Add(fault);

        db.JobCards.Add(new JobCard
        {
            TenantId = tenantId,
            VehicleId = vf.Id,
            Fault = fault,
            JobNumber = $"JC-{tenantId:D3}-{now:yyMMddHHmmss}",
            Title = "Brake system diagnosis & repair",
            Description = "Diagnose brake warning, replace worn pads and inspect ABS sensors.",
            Priority = "High",
            Status = "InProgress",
            CreatedDate = now.AddDays(-2),
            StartDate = now.AddDays(-1),
            EstimatedCost = 4200m
        });
    }

    private static async Task<Manufacturer> GetOrCreateManufacturerAsync(
        ApplicationDbContext db, string name, string country)
    {
        var manufacturer = await db.Manufacturers.FirstOrDefaultAsync(m => m.Name == name);
        if (manufacturer is null)
        {
            manufacturer = new Manufacturer { Name = name, Country = country, Website = "" };
            db.Manufacturers.Add(manufacturer);
            await db.SaveChangesAsync();
        }
        return manufacturer;
    }

    // ----- Realistic South African fleet demo data -----

    private sealed record VehicleSeed(
        string Manufacturer, string ManufacturerCountry, string Model, int Year,
        string Registration, string Vin, string Color, decimal Mileage, string Status,
        DateTime PurchaseDate, DateTime? LastServiceDate);

    private sealed record TenantSeed(
        string Name, string ContactEmail, string ContactPhone, string Location,
        string AdminEmail, string AdminFirstName, string AdminLastName,
        string FleetName, string FleetDescription, VehicleSeed[] Vehicles);

    private static readonly TenantSeed[] SouthAfricanTenantSeeds =
    {
        new TenantSeed(
            "Golden Arrow Bus Services", "operations@goldenarrow.co.za", "+27 21 507 8800",
            "Cape Town, Western Cape",
            "admin@goldenarrow.co.za", "Thandeka", "Nkosi",
            "Cape Town Metro Bus Fleet", "Commuter bus fleet servicing the Cape Town metropolitan area.",
            new[]
            {
                new VehicleSeed("Volvo", "Sweden", "B8R Coach", 2021, "CA 812-345",
                    "YV3T2R921MA100011", "White", 184230m, "Active",
                    new DateTime(2021, 3, 12), new DateTime(2026, 6, 1)),
                new VehicleSeed("MAN", "Germany", "Lion's Explorer", 2020, "CA 447-118",
                    "WMAN18ZZ4LP200022", "Blue", 221540m, "Active",
                    new DateTime(2020, 7, 8), new DateTime(2026, 5, 20)),
                new VehicleSeed("Mercedes-Benz", "Germany", "OC 500 LE", 2022, "CA 903-776",
                    "WDB95000013100033", "White", 96110m, "InService",
                    new DateTime(2022, 1, 25), new DateTime(2026, 7, 3)),
            }),

        new TenantSeed(
            "Imperial Logistics", "fleet@imperiallogistics.co.za", "+27 11 372 6500",
            "Johannesburg, Gauteng",
            "admin@imperiallogistics.co.za", "Sipho", "Dlamini",
            "Gauteng Long-Haul Fleet", "Long-haul freight trucks operating across the N1 and N3 corridors.",
            new[]
            {
                new VehicleSeed("Scania", "Sweden", "R500 Truck Tractor", 2021, "GP 55-DK-GP",
                    "XLER4X20005100044", "Red", 412300m, "Active",
                    new DateTime(2021, 2, 18), new DateTime(2026, 6, 15)),
                new VehicleSeed("Volvo", "Sweden", "FH16 750", 2022, "GP 88-LM-GP",
                    "YV2RT40A1NB100055", "White", 268900m, "Active",
                    new DateTime(2022, 4, 4), new DateTime(2026, 7, 1)),
                new VehicleSeed("UD Trucks", "Japan", "Quon GW26", 2020, "GP 12-QR-GP",
                    "JNCMBB01A0A100066", "Silver", 355700m, "OutOfService",
                    new DateTime(2020, 9, 30), new DateTime(2026, 4, 10)),
            }),

        new TenantSeed(
            "Unitrans Supply Chain", "support@unitrans.co.za", "+27 31 570 4000",
            "Durban, KwaZulu-Natal",
            "admin@unitrans.co.za", "Nomsa", "Zulu",
            "Durban Port Distribution Fleet", "Container and bulk distribution fleet serving the Port of Durban.",
            new[]
            {
                new VehicleSeed("Isuzu", "Japan", "FTR 850 AMT", 2021, "ND 234-567",
                    "JAANPR75HM7100077", "White", 158420m, "Active",
                    new DateTime(2021, 6, 22), new DateTime(2026, 5, 28)),
                new VehicleSeed("Hino", "Japan", "500 Series 1626", 2022, "ND 765-432",
                    "JHDFC7JGX0K100088", "Blue", 89230m, "Active",
                    new DateTime(2022, 3, 15), new DateTime(2026, 6, 30)),
                new VehicleSeed("FAW", "China", "28.380 FT", 2019, "ND 998-100",
                    "LFWSRXSJ9K1100099", "Grey", 298650m, "InService",
                    new DateTime(2019, 11, 5), new DateTime(2026, 3, 18)),
            }),

        new TenantSeed(
            "Bidvest Prestige Fleet", "fleet@bidvestprestige.co.za", "+27 12 683 4000",
            "Pretoria, Gauteng",
            "admin@bidvestprestige.co.za", "Johan", "van der Merwe",
            "Pretoria Service Vehicle Fleet", "Light commercial vehicles for facilities and cleaning services.",
            new[]
            {
                new VehicleSeed("Toyota", "Japan", "Hilux 2.4 GD-6", 2023, "GP 34-TY-GP",
                    "AHTFR22G109100101", "White", 42310m, "Active",
                    new DateTime(2023, 2, 9), new DateTime(2026, 7, 2)),
                new VehicleSeed("Ford", "United States", "Ranger 2.0 XLT", 2022, "GP 76-FR-GP",
                    "6FPPXXMJ2PK100112", "Silver", 78560m, "Active",
                    new DateTime(2022, 8, 14), new DateTime(2026, 6, 11)),
                new VehicleSeed("Nissan", "Japan", "NP200 1.6", 2021, "GP 90-NS-GP",
                    "ADNUSN1D5M0100123", "White", 121400m, "Active",
                    new DateTime(2021, 5, 30), new DateTime(2026, 5, 5)),
            }),

        new TenantSeed(
            "Cargo Carriers", "operations@cargocarriers.co.za", "+27 11 823 5600",
            "Gqeberha (Port Elizabeth), Eastern Cape",
            "admin@cargocarriers.co.za", "Lerato", "Mokoena",
            "Eastern Cape Bulk Fleet", "Bulk tanker and dry-bulk trucks serving Eastern Cape industry.",
            new[]
            {
                new VehicleSeed("Mercedes-Benz", "Germany", "Actros 2645", 2021, "EC 45-CC-EC",
                    "WDB93403010100134", "White", 305120m, "Active",
                    new DateTime(2021, 1, 19), new DateTime(2026, 6, 8)),
                new VehicleSeed("Scania", "Sweden", "G460 Truck Tractor", 2020, "EC 78-CC-EC",
                    "XLEG4X20005100145", "Blue", 388400m, "Active",
                    new DateTime(2020, 10, 11), new DateTime(2026, 4, 22)),
                new VehicleSeed("Iveco", "Italy", "Stralis Hi-Way", 2019, "EC 11-CC-EC",
                    "ZCFA1TM0420100156", "Red", 421870m, "OutOfService",
                    new DateTime(2019, 6, 27), new DateTime(2026, 2, 14)),
            }),
    };
}
