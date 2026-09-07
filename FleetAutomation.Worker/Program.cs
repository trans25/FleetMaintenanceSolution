using Fleet.Core.Automation;
using Fleet.Core.Common;
using Fleet.Core.Data;
using FleetAutomation.Worker;
using Microsoft.EntityFrameworkCore;
using Serilog;

var builder = Host.CreateApplicationBuilder(args);

// Structured logging with Serilog
var logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateLogger();
builder.Logging.ClearProviders();
builder.Logging.AddSerilog(logger, dispose: true);

// Entity Framework with SQL Server (shared FleetMaintenanceDB)
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")));

// Automation configuration bound from the "Automation" section
builder.Services.Configure<AutomationOptions>(
    builder.Configuration.GetSection(AutomationOptions.SectionName));

// Email seam + automation services (notification dispatch + rule engine)
builder.Services.AddPlatformEmail(builder.Configuration);
builder.Services.AddFleetAutomation();

// Hosted background worker
builder.Services.AddHostedService<AutomationWorker>();

var host = builder.Build();
host.Run();
