using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Fleet.Core.Data;

/// <summary>
/// Enables EF Core design-time tooling (migrations) to construct the context
/// without a running host, using the local SQL Server developer instance.
/// </summary>
public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    public ApplicationDbContext CreateDbContext(string[] args)
    {
        var connectionString =
            "Server=ELIAS\\SQLDEVELOPER;Database=FleetMaintenanceDB;Trusted_Connection=true;MultipleActiveResultSets=true;TrustServerCertificate=true";

        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlServer(connectionString)
            .Options;

        return new ApplicationDbContext(options);
    }
}
