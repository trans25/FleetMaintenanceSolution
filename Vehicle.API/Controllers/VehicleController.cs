using Fleet.Core.Domain;
using Fleet.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Vehicle.API.ViewModels;

namespace Vehicle.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VehicleController : ControllerBase
{
    private readonly IVehicleService _vehicleService;

    public VehicleController(IVehicleService vehicleService)
    {
        _vehicleService = vehicleService;
    }

    [HttpGet]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<IEnumerable<Fleet.Core.Domain.Vehicle>>> GetAllVehicles()
    {
        var vehicles = await _vehicleService.GetAllVehiclesAsync();
        return Ok(vehicles);
    }

    [HttpGet("{id}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<Fleet.Core.Domain.Vehicle>> GetVehicleById(int id)
    {
        var vehicle = await _vehicleService.GetVehicleByIdAsync(id);
        return vehicle == null ? NotFound($"Vehicle with ID {id} not found") : Ok(vehicle);
    }

    [HttpGet("registration/{registrationNumber}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<Fleet.Core.Domain.Vehicle>> GetVehicleByRegistration(string registrationNumber)
    {
        var vehicle = await _vehicleService.GetVehicleByRegistrationAsync(registrationNumber);
        return vehicle == null ? NotFound($"Vehicle with registration {registrationNumber} not found") : Ok(vehicle);
    }

    [HttpGet("vin/{vin}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<Fleet.Core.Domain.Vehicle>> GetVehicleByVIN(string vin)
    {
        var vehicle = await _vehicleService.GetVehicleByVINAsync(vin);
        return vehicle == null ? NotFound($"Vehicle with VIN {vin} not found") : Ok(vehicle);
    }

    [HttpGet("fleet/{fleetId}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<IEnumerable<Fleet.Core.Domain.Vehicle>>> GetVehiclesByFleetId(int fleetId)
    {
        var vehicles = await _vehicleService.GetVehiclesByFleetIdAsync(fleetId);
        return Ok(vehicles);
    }

    [HttpGet("status/{status}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<IEnumerable<Fleet.Core.Domain.Vehicle>>> GetVehiclesByStatus(string status)
    {
        var vehicles = await _vehicleService.GetVehiclesByStatusAsync(status);
        return Ok(vehicles);
    }

    [HttpPost]
    [Authorize(Policy = "CanAdd")]
    public async Task<ActionResult<Fleet.Core.Domain.Vehicle>> CreateVehicle([FromBody] CreateVehicleViewModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var vehicle = new Fleet.Core.Domain.Vehicle
        {
            TenantId = model.TenantId,
            FleetId = model.FleetId,
            ManufacturerId = model.ManufacturerId,
            RegistrationNumber = model.RegistrationNumber,
            VIN = model.VIN,
            Model = model.Model,
            Year = model.Year,
            Color = model.Color,
            Mileage = model.Mileage,
            Status = model.Status,
            PurchaseDate = model.PurchaseDate
        };

        var createdVehicle = await _vehicleService.CreateVehicleAsync(vehicle);
        return CreatedAtAction(nameof(GetVehicleById), new { id = createdVehicle.Id }, createdVehicle);
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "CanEdit")]
    public async Task<ActionResult<Fleet.Core.Domain.Vehicle>> UpdateVehicle(int id, [FromBody] UpdateVehicleViewModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (id != model.Id)
            return BadRequest("ID mismatch");

        var existingVehicle = await _vehicleService.GetVehicleByIdAsync(id);
        if (existingVehicle == null)
            return NotFound($"Vehicle with ID {id} not found");

        var vehicle = new Fleet.Core.Domain.Vehicle
        {
            Id = model.Id,
            TenantId = model.TenantId,
            FleetId = model.FleetId,
            ManufacturerId = model.ManufacturerId,
            RegistrationNumber = model.RegistrationNumber,
            VIN = model.VIN,
            Model = model.Model,
            Year = model.Year,
            Color = model.Color,
            Mileage = model.Mileage,
            Status = model.Status,
            PurchaseDate = model.PurchaseDate,
            LastServiceDate = model.LastServiceDate
        };

        var updatedVehicle = await _vehicleService.UpdateVehicleAsync(vehicle);
        return Ok(updatedVehicle);
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "CanDelete")]
    public async Task<ActionResult> DeleteVehicle(int id)
    {
        var result = await _vehicleService.DeleteVehicleAsync(id);
        return result ? NoContent() : NotFound($"Vehicle with ID {id} not found");
    }
}

