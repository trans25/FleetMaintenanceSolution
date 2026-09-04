using Asp.Versioning;
using Fleet.Core.Data;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.DependencyInjection;

namespace Fleet.Core.Common;

/// <summary>
/// Shared registration helpers so every API wires cross-cutting concerns
/// (API versioning, health checks, email seam) the same way.
/// </summary>
public static class PlatformServiceExtensions
{
    public static IServiceCollection AddPlatformApiVersioning(this IServiceCollection services)
    {
        services.AddApiVersioning(options =>
        {
            options.DefaultApiVersion = new ApiVersion(1, 0);
            options.AssumeDefaultVersionWhenUnspecified = true;
            options.ReportApiVersions = true;
            options.ApiVersionReader = new UrlSegmentApiVersionReader();
        })
        .AddApiExplorer(options =>
        {
            options.GroupNameFormat = "'v'VVV";
            options.SubstituteApiVersionInUrl = true;
        });

        return services;
    }

    public static IServiceCollection AddPlatformHealthChecks(this IServiceCollection services)
    {
        services.AddHealthChecks()
            .AddDbContextCheck<ApplicationDbContext>("database");
        return services;
    }

    public static IServiceCollection AddPlatformEmail(this IServiceCollection services)
    {
        services.AddScoped<IEmailSender, LoggingEmailSender>();
        return services;
    }

    /// <summary>
    /// Maps /health (liveness) and /health/ready (readiness incl. DB).
    /// </summary>
    public static void MapPlatformHealthChecks(this WebApplication app)
    {
        app.MapHealthChecks("/health", new HealthCheckOptions
        {
            Predicate = _ => false // liveness: process is up
        });
        app.MapHealthChecks("/health/ready");
    }
}
