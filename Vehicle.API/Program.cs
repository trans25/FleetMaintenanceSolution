using Fleet.Core.Data;
using Fleet.Core.Interfaces;
using Fleet.Core.Repositories;
using Fleet.Core.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using Vehicle.API.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

// Configure Entity Framework with SQL Server
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        b => b.MigrationsAssembly("Vehicle.API")));

// Register repositories
builder.Services.AddScoped<IVehicleRepository, VehicleRepository>();
builder.Services.AddScoped<IFleetRepository, FleetRepository>();
builder.Services.AddScoped<IManufacturerRepository, ManufacturerRepository>();
builder.Services.AddScoped<IServiceScheduleRepository, ServiceScheduleRepository>();
builder.Services.AddScoped<IFaultRepository, FaultRepository>();
builder.Services.AddScoped<IJobCardRepository, JobCardRepository>();
builder.Services.AddScoped<IJobCardTaskRepository, JobCardTaskRepository>();
builder.Services.AddScoped<ITenantRepository, TenantRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IRoleRepository, RoleRepository>();

// Register services
builder.Services.AddScoped<IVehicleService, VehicleService>();
builder.Services.AddScoped<IFleetService, FleetService>();
builder.Services.AddScoped<IServiceScheduleService, ServiceScheduleService>();
builder.Services.AddScoped<IFaultService, FaultService>();
builder.Services.AddScoped<IJobCardService, JobCardService>();
builder.Services.AddScoped<IAuthService, AuthService>();

// Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey is not configured");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
    };
});

builder.Services.AddAuthorization(options =>
{
    // Role-based policies aligned with Fleet Maintenance Permission Matrix
    
    // Full Access - SystemAdmin only
    options.AddPolicy("RequireSystemAdmin", policy => 
        policy.RequireRole("SystemAdmin"));
    
    // Admin Access - SystemAdmin and TenantAdmin
    options.AddPolicy("RequireAdmin", policy => 
        policy.RequireRole("SystemAdmin", "TenantAdmin"));
    
    // Management Access - SystemAdmin, TenantAdmin, FleetManager
    options.AddPolicy("RequireManager", policy => 
        policy.RequireRole("SystemAdmin", "TenantAdmin", "FleetManager"));
    
    // Write Access - SystemAdmin, TenantAdmin, FleetManager, Technician
    options.AddPolicy("RequireWriteAccess", policy => 
        policy.RequireRole("SystemAdmin", "TenantAdmin", "FleetManager", "Technician"));
    
    // Staff Access - SystemAdmin, TenantAdmin, FleetManager, Technician, Staff
    options.AddPolicy("RequireStaffAccess", policy => 
        policy.RequireRole("SystemAdmin", "TenantAdmin", "FleetManager", "Technician", "Staff"));
    
    // Read Access - All roles except Guest
    options.AddPolicy("RequireReadAccess", policy => 
        policy.RequireRole("SystemAdmin", "TenantAdmin", "FleetManager", "Technician", "Staff", "Auditor"));
    
    // View Access - All authenticated users (including Guest)
    options.AddPolicy("RequireAuthenticated", policy => 
        policy.RequireAuthenticatedUser());
    
    // Specific permission policies based on action type
    options.AddPolicy("CanDelete", policy => 
        policy.RequireRole("SystemAdmin", "TenantAdmin"));
    
    options.AddPolicy("CanEdit", policy => 
        policy.RequireRole("SystemAdmin", "TenantAdmin", "FleetManager", "Technician"));
    
    options.AddPolicy("CanAdd", policy => 
        policy.RequireRole("SystemAdmin", "TenantAdmin", "FleetManager", "Staff"));
    
    options.AddPolicy("CanView", policy => 
        policy.RequireAuthenticatedUser());
});

// Configure Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Fleet Maintenance - Vehicle API",
        Version = "v1",
        Description = "Vehicle microservice for Fleet Maintenance System"
    });

    // Add JWT Authentication to Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Vehicle API v1");
    });
}

app.UseHttpsRedirection();

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
