using Fleet.Core.Interfaces;
using Fleet.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Vehicle.API.DTOs;

namespace Vehicle.API.Controllers;

/// <summary>
/// Vehicle Controller with Multi-Tenant Support
/// 
/// KEY FEATURES:
/// - All queries automatically filtered by current user's TenantId
/// - New vehicles automatically assigned to current user's tenant
/// - Cross-tenant access prevented at database level
/// - No need to manually check or set TenantId in controller methods
/// 
/// SECURITY:
/// - Global query filters ensure data isolation
/// - DbContext prevents cross-tenant data creation/modification
/// - TenantId automatically extracted from JWT claims
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VehicleExampleController : ControllerBase
{
    private readonly IVehicleService _vehicleService;
    private readonly ITenantService _tenantService;
    private readonly ILogger<VehicleExampleController> _logger;

    public VehicleExampleController(
        IVehicleService vehicleService, 
        ITenantService tenantService,
        ILogger<VehicleExampleController> logger)
    {
        _vehicleService = vehicleService;
        _tenantService = tenantService;
        _logger = logger;
    }

    /// <summary>
    /// Gets all vehicles for the current tenant
    /// Global query filter automatically filters by TenantId from JWT
    /// User will ONLY see vehicles belonging to their tenant
    /// </summary>
    /// <returns>List of vehicles for current tenant</returns>
    [HttpGet]
    [Authorize(Policy = "CanView")]
    [ProducesResponseType(typeof(IEnumerable<VehicleDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<VehicleDto>>> GetAllVehicles()
    {
        try
        {
            // Log current tenant for debugging (optional)
            var tenantId = _tenantService.GetTenantId();
            _logger.LogInformation("User from Tenant {TenantId} requesting all vehicles", tenantId);

            // Get vehicles - automatically filtered by TenantId
            var vehicles = await _vehicleService.GetAllVehiclesAsync();

            // Map to DTOs (you can use AutoMapper for this)
            var vehicleDtos = vehicles.Select(v => new VehicleDto
            {
                Id = v.Id,
                TenantId = v.TenantId,
                FleetId = v.FleetId,
                FleetName = v.Fleet?.Name ?? "",
                ManufacturerId = v.ManufacturerId,
                ManufacturerName = v.Manufacturer?.Name ?? "",
                RegistrationNumber = v.RegistrationNumber,
                VIN = v.VIN,
                Model = v.Model,
                Year = v.Year,
                Color = v.Color,
                Mileage = v.Mileage,
                Status = v.Status,
                PurchaseDate = v.PurchaseDate,
                LastServiceDate = v.LastServiceDate,
                CreatedAt = v.CreatedAt,
                UpdatedAt = v.UpdatedAt
            });

            return Ok(vehicleDtos);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized access attempt");
            return Unauthorized(new { message = "Tenant context required" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving vehicles");
            return StatusCode(500, new { message = "An error occurred while retrieving vehicles" });
        }
    }

    /// <summary>
    /// Gets a specific vehicle by ID
    /// Returns 404 if vehicle doesn't exist OR belongs to a different tenant
    /// Global query filter ensures cross-tenant access is prevented
    /// </summary>
    /// <param name="id">Vehicle ID</param>
    /// <returns>Vehicle details if found and belongs to current tenant</returns>
    [HttpGet("{id}")]
    [Authorize(Policy = "CanView")]
    [ProducesResponseType(typeof(VehicleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<VehicleDto>> GetVehicleById(int id)
    {
        try
        {
            // Global query filter ensures we can only get vehicle from our tenant
            var vehicle = await _vehicleService.GetVehicleByIdAsync(id);
            
            if (vehicle == null)
            {
                // Could be: vehicle doesn't exist OR belongs to different tenant
                // Either way, we return 404 (don't reveal if vehicle exists in other tenant)
                return NotFound(new { message = $"Vehicle with ID {id} not found" });
            }

            var vehicleDto = new VehicleDto
            {
                Id = vehicle.Id,
                TenantId = vehicle.TenantId,
                FleetId = vehicle.FleetId,
                FleetName = vehicle.Fleet?.Name ?? "",
                ManufacturerId = vehicle.ManufacturerId,
                ManufacturerName = vehicle.Manufacturer?.Name ?? "",
                RegistrationNumber = vehicle.RegistrationNumber,
                VIN = vehicle.VIN,
                Model = vehicle.Model,
                Year = vehicle.Year,
                Color = vehicle.Color,
                Mileage = vehicle.Mileage,
                Status = vehicle.Status,
                PurchaseDate = vehicle.PurchaseDate,
                LastServiceDate = vehicle.LastServiceDate,
                CreatedAt = vehicle.CreatedAt,
                UpdatedAt = vehicle.UpdatedAt
            };

            return Ok(vehicleDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving vehicle {VehicleId}", id);
            return StatusCode(500, new { message = "An error occurred while retrieving the vehicle" });
        }
    }

    /// <summary>
    /// Creates a new vehicle for the current tenant
    /// TenantId is AUTOMATICALLY set from JWT claims - no need to include in request
    /// If user tries to set a different TenantId, it will be rejected
    /// </summary>
    /// <param name="createDto">Vehicle creation data (WITHOUT TenantId)</param>
    /// <returns>Created vehicle</returns>
    [HttpPost]
    [Authorize(Policy = "CanAdd")]
    [ProducesResponseType(typeof(VehicleDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<VehicleDto>> CreateVehicle([FromBody] CreateVehicleDto createDto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Map DTO to entity
            var vehicle = new Fleet.Core.Domain.Vehicle
            {
                // DO NOT SET TenantId - it will be auto-assigned from JWT
                FleetId = createDto.FleetId,
                ManufacturerId = createDto.ManufacturerId,
                RegistrationNumber = createDto.RegistrationNumber,
                VIN = createDto.VIN,
                Model = createDto.Model,
                Year = createDto.Year,
                Color = createDto.Color,
                Mileage = createDto.Mileage,
                Status = createDto.Status,
                PurchaseDate = createDto.PurchaseDate
            };

            // TenantId will be automatically set in DbContext.SaveChangesAsync
            var createdVehicle = await _vehicleService.CreateVehicleAsync(vehicle);

            _logger.LogInformation(
                "Vehicle {VehicleId} created for Tenant {TenantId}", 
                createdVehicle.Id, 
                createdVehicle.TenantId);

            var vehicleDto = new VehicleDto
            {
                Id = createdVehicle.Id,
                TenantId = createdVehicle.TenantId,
                FleetId = createdVehicle.FleetId,
                ManufacturerId = createdVehicle.ManufacturerId,
                RegistrationNumber = createdVehicle.RegistrationNumber,
                VIN = createdVehicle.VIN,
                Model = createdVehicle.Model,
                Year = createdVehicle.Year,
                Color = createdVehicle.Color,
                Mileage = createdVehicle.Mileage,
                Status = createdVehicle.Status,
                PurchaseDate = createdVehicle.PurchaseDate,
                CreatedAt = createdVehicle.CreatedAt
            };

            return CreatedAtAction(
                nameof(GetVehicleById), 
                new { id = vehicleDto.Id }, 
                vehicleDto);
        }
        catch (UnauthorizedAccessException ex)
        {
            // This happens if:
            // 1. User not authenticated
            // 2. TenantId missing from JWT
            // 3. User tries to create vehicle for different tenant
            _logger.LogWarning(ex, "Unauthorized vehicle creation attempt");
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating vehicle");
            return StatusCode(500, new { message = "An error occurred while creating the vehicle" });
        }
    }

    /// <summary>
    /// Updates an existing vehicle
    /// Can ONLY update vehicles belonging to current tenant
    /// TenantId cannot be changed (immutable)
    /// </summary>
    /// <param name="id">Vehicle ID</param>
    /// <param name="updateDto">Updated vehicle data</param>
    /// <returns>Updated vehicle</returns>
    [HttpPut("{id}")]
    [Authorize(Policy = "CanEdit")]
    [ProducesResponseType(typeof(VehicleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<VehicleDto>> UpdateVehicle(int id, [FromBody] UpdateVehicleDto updateDto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (id != updateDto.Id)
                return BadRequest(new { message = "ID mismatch" });

            // Check if vehicle exists and belongs to current tenant
            var existingVehicle = await _vehicleService.GetVehicleByIdAsync(id);
            if (existingVehicle == null)
            {
                // Either doesn't exist or belongs to different tenant
                return NotFound(new { message = $"Vehicle with ID {id} not found" });
            }

            // Update properties
            existingVehicle.FleetId = updateDto.FleetId;
            existingVehicle.ManufacturerId = updateDto.ManufacturerId;
            existingVehicle.RegistrationNumber = updateDto.RegistrationNumber;
            existingVehicle.VIN = updateDto.VIN;
            existingVehicle.Model = updateDto.Model;
            existingVehicle.Year = updateDto.Year;
            existingVehicle.Color = updateDto.Color;
            existingVehicle.Mileage = updateDto.Mileage;
            existingVehicle.Status = updateDto.Status;
            existingVehicle.PurchaseDate = updateDto.PurchaseDate;
            existingVehicle.LastServiceDate = updateDto.LastServiceDate;
            existingVehicle.UpdatedAt = DateTime.UtcNow;

            // DbContext will verify vehicle belongs to current tenant
            var updatedVehicle = await _vehicleService.UpdateVehicleAsync(existingVehicle);

            _logger.LogInformation(
                "Vehicle {VehicleId} updated by Tenant {TenantId}", 
                updatedVehicle.Id, 
                updatedVehicle.TenantId);

            var vehicleDto = new VehicleDto
            {
                Id = updatedVehicle.Id,
                TenantId = updatedVehicle.TenantId,
                FleetId = updatedVehicle.FleetId,
                ManufacturerId = updatedVehicle.ManufacturerId,
                RegistrationNumber = updatedVehicle.RegistrationNumber,
                VIN = updatedVehicle.VIN,
                Model = updatedVehicle.Model,
                Year = updatedVehicle.Year,
                Color = updatedVehicle.Color,
                Mileage = updatedVehicle.Mileage,
                Status = updatedVehicle.Status,
                PurchaseDate = updatedVehicle.PurchaseDate,
                LastServiceDate = updatedVehicle.LastServiceDate,
                CreatedAt = updatedVehicle.CreatedAt,
                UpdatedAt = updatedVehicle.UpdatedAt
            };

            return Ok(vehicleDto);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized vehicle update attempt for Vehicle {VehicleId}", id);
            return Unauthorized(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation on Vehicle {VehicleId}", id);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating vehicle {VehicleId}", id);
            return StatusCode(500, new { message = "An error occurred while updating the vehicle" });
        }
    }

    /// <summary>
    /// Deletes a vehicle
    /// Can ONLY delete vehicles belonging to current tenant
    /// </summary>
    /// <param name="id">Vehicle ID</param>
    /// <returns>Success message</returns>
    [HttpDelete("{id}")]
    [Authorize(Policy = "CanDelete")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> DeleteVehicle(int id)
    {
        try
        {
            // Global query filter ensures we can only delete from our tenant
            var result = await _vehicleService.DeleteVehicleAsync(id);
            
            if (!result)
            {
                // Either doesn't exist or belongs to different tenant
                return NotFound(new { message = $"Vehicle with ID {id} not found" });
            }

            var tenantId = _tenantService.GetTenantId();
            _logger.LogInformation(
                "Vehicle {VehicleId} deleted by Tenant {TenantId}", 
                id, 
                tenantId);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting vehicle {VehicleId}", id);
            return StatusCode(500, new { message = "An error occurred while deleting the vehicle" });
        }
    }

    /// <summary>
    /// Gets vehicles by status for current tenant
    /// Demonstrates filtering with tenant isolation
    /// </summary>
    /// <param name="status">Vehicle status (Active, Maintenance, etc.)</param>
    /// <returns>Vehicles with specified status from current tenant</returns>
    [HttpGet("status/{status}")]
    [Authorize(Policy = "CanView")]
    [ProducesResponseType(typeof(IEnumerable<VehicleDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<VehicleDto>>> GetVehiclesByStatus(string status)
    {
        try
        {
            // Global query filter + status filter = tenant-scoped status query
            var vehicles = await _vehicleService.GetVehiclesByStatusAsync(status);

            var vehicleDtos = vehicles.Select(v => new VehicleDto
            {
                Id = v.Id,
                TenantId = v.TenantId,
                RegistrationNumber = v.RegistrationNumber,
                Model = v.Model,
                Status = v.Status,
                FleetName = v.Fleet?.Name ?? "",
                ManufacturerName = v.Manufacturer?.Name ?? ""
            });

            return Ok(vehicleDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving vehicles by status {Status}", status);
            return StatusCode(500, new { message = "An error occurred while retrieving vehicles" });
        }
    }

    /// <summary>
    /// DEMONSTRATION: Shows current tenant information
    /// Useful for debugging multi-tenant setup
    /// </summary>
    /// <returns>Current user's tenant information</returns>
    [HttpGet("tenant-info")]
    [Authorize]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public ActionResult GetTenantInfo()
    {
        var tenantId = _tenantService.GetTenantId();
        var userId = _tenantService.GetUserId();

        return Ok(new
        {
            tenantId,
            userId,
            userName = User.Identity?.Name,
            roles = User.Claims
                .Where(c => c.Type == System.Security.Claims.ClaimTypes.Role)
                .Select(c => c.Value)
                .ToList(),
            message = "This endpoint shows your current tenant context"
        });
    }
}
