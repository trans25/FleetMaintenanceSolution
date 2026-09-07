using Asp.Versioning;
using Fleet.Core.Data;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Configuration;
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

    /// <summary>
    /// Registers the email sender. When configuration sets
    /// <c>Email:Provider = "Smtp"</c> and a non-empty <c>Email:Smtp:Host</c>,
    /// a real <see cref="SmtpEmailSender"/> is used; otherwise the development
    /// <see cref="LoggingEmailSender"/> is registered. Credentials are read from
    /// configuration/environment only (never hardcoded).
    /// </summary>
    public static IServiceCollection AddPlatformEmail(this IServiceCollection services, IConfiguration configuration)
    {
        var smtpSection = configuration.GetSection("Email:Smtp");
        services.Configure<SmtpOptions>(smtpSection);

        var provider = configuration["Email:Provider"];
        var host = smtpSection["Host"];

        if (string.Equals(provider, "Smtp", StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(host))
        {
            services.AddScoped<IEmailSender, SmtpEmailSender>();
        }
        else
        {
            services.AddScoped<IEmailSender, LoggingEmailSender>();
        }

        return services;
    }

    /// <summary>
    /// Registers the fleet automation services (rule evaluation + notification
    /// dispatch/audit). Requires <see cref="AddPlatformEmail"/> and a registered
    /// <c>ApplicationDbContext</c>.
    /// </summary>
    public static IServiceCollection AddFleetAutomation(this IServiceCollection services)
    {
        services.AddScoped<Automation.INotificationService, Automation.NotificationService>();
        services.AddScoped<Automation.IFleetAlertService, Automation.FleetAlertService>();
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
