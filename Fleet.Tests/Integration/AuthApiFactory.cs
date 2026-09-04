using System.Linq;
using Fleet.Core.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Fleet.Tests.Integration;

/// <summary>
/// Boots the Auth.API in-process with an EF Core InMemory database and test
/// JWT configuration so integration tests run without SQL Server or user-secrets.
/// </summary>
public class AuthApiFactory : WebApplicationFactory<Program>
{
    public const string TestSecretKey = "IntegrationTestSecretKeyForJwtGeneration1234567890!";
    public const string TestIssuer = "FleetMaintenanceAPI";
    public const string TestAudience = "FleetMaintenanceClients";

    private readonly string _databaseName = "AuthApiTests-" + Guid.NewGuid();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        // UseSetting writes to host configuration, which has higher precedence
        // than appsettings.json (whose SecretKey is intentionally blank for
        // user-secrets), guaranteeing a valid signing key during tests.
        builder.UseSetting("JwtSettings:SecretKey", TestSecretKey);
        builder.UseSetting("JwtSettings:Issuer", TestIssuer);
        builder.UseSetting("JwtSettings:Audience", TestAudience);
        builder.UseSetting("JwtSettings:ExpirationMinutes", "60");
        builder.UseSetting("JwtSettings:RefreshTokenDays", "7");
        builder.UseSetting("JwtSettings:ResetTokenHours", "1");

        builder.ConfigureServices(services =>
        {
            // Remove the SQL Server DbContext registration.
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
            if (descriptor is not null)
                services.Remove(descriptor);

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase(_databaseName));

            // Materialize the schema and seed data (roles, default tenant).
            using var scope = services.BuildServiceProvider().CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            db.Database.EnsureCreated();
        });
    }
}
