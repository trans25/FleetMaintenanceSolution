using Fleet.Core.Common;
using Fleet.Core.Domain;
using Fleet.Core.Services;
using Fleet.Core.ViewModels.Vehicles;
using Fleet.Core.ViewModels.Import;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Fleet.API.Controllers;

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
    public async Task<ActionResult<PagedResult<VehicleListViewModel>>> GetAllVehicles([FromQuery] VehicleQuery query)
    {
        var vehicles = ApplyTenantScope(await _vehicleService.GetAllVehiclesAsync());

        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            vehicles = vehicles.Where(v =>
                string.Equals(v.Status, query.Status, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim();
            vehicles = vehicles.Where(v =>
                (v.RegistrationNumber?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false) ||
                (v.Model?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false) ||
                (v.VIN?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false));
        }

        var vms = vehicles
            .OrderBy(v => v.RegistrationNumber)
            .Select(MapToListViewModel);
        return Ok(PagedResult<VehicleListViewModel>.Create(vms, query.Page, query.PageSize));
    }

    [HttpGet("{id}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<VehicleDetailViewModel>> GetVehicleById(int id)
    {
        var vehicle = await _vehicleService.GetVehicleByIdAsync(id);
        if (vehicle == null)
            return NotFound($"Vehicle with ID {id} not found");
        if (!CanAccessTenant(vehicle.TenantId))
            return Forbid();
        return Ok(MapToDetailViewModel(vehicle));
    }

    [HttpGet("registration/{registrationNumber}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<VehicleDetailViewModel>> GetVehicleByRegistration(string registrationNumber)
    {
        var vehicle = await _vehicleService.GetVehicleByRegistrationAsync(registrationNumber);
        if (vehicle == null)
            return NotFound($"Vehicle with registration {registrationNumber} not found");
        if (!CanAccessTenant(vehicle.TenantId))
            return Forbid();
        return Ok(MapToDetailViewModel(vehicle));
    }

    [HttpGet("vin/{vin}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<VehicleDetailViewModel>> GetVehicleByVIN(string vin)
    {
        var vehicle = await _vehicleService.GetVehicleByVINAsync(vin);
        if (vehicle == null)
            return NotFound($"Vehicle with VIN {vin} not found");
        if (!CanAccessTenant(vehicle.TenantId))
            return Forbid();
        return Ok(MapToDetailViewModel(vehicle));
    }

    [HttpGet("fleet/{fleetId}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<PagedResult<VehicleListViewModel>>> GetVehiclesByFleetId(int fleetId, [FromQuery] PaginationQuery pagination)
    {
        var vehicles = ApplyTenantScope(await _vehicleService.GetVehiclesByFleetIdAsync(fleetId));
        var vms = vehicles.Select(MapToListViewModel);
        return Ok(PagedResult<VehicleListViewModel>.Create(vms, pagination.Page, pagination.PageSize));
    }

    [HttpGet("status/{status}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<PagedResult<VehicleListViewModel>>> GetVehiclesByStatus(string status, [FromQuery] PaginationQuery pagination)
    {
        var vehicles = ApplyTenantScope(await _vehicleService.GetVehiclesByStatusAsync(status));
        var vms = vehicles.Select(MapToListViewModel);
        return Ok(PagedResult<VehicleListViewModel>.Create(vms, pagination.Page, pagination.PageSize));
    }

    [HttpPost]
    [Authorize(Policy = "CanAdd")]
    public async Task<ActionResult<VehicleDetailViewModel>> CreateVehicle([FromBody] CreateVehicleViewModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var tenantId = User.GetTenantId();
        if (tenantId is null && !User.IsSystemAdmin())
            return Forbid();

        var vehicle = new Vehicle
        {
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
            LastServiceDate = model.LastServiceDate,
            TenantId = tenantId ?? 0
        };

        var created = await _vehicleService.CreateVehicleAsync(vehicle);
        return CreatedAtAction(nameof(GetVehicleById), new { id = created.Id }, MapToDetailViewModel(created));
    }

    // Bulk-import vehicles from a CSV upload. TenantId is always taken from the
    // caller's claim. Header:
    // RegistrationNumber,VIN,Model,Year,FleetId,ManufacturerId,Color,Mileage,Status
    [HttpPost("import")]
    [Authorize(Policy = "CanAdd")]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<ActionResult<ImportResult>> ImportVehicles(IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest("No file uploaded.");

        var tenantId = User.GetTenantId();
        if (tenantId is null)
            return Forbid();

        var result = new ImportResult();
        using var reader = new StreamReader(file.OpenReadStream());

        string? line;
        var rowNumber = 0;
        var isHeader = true;
        while ((line = await reader.ReadLineAsync()) is not null)
        {
            if (isHeader) { isHeader = false; continue; }
            rowNumber++;
            if (string.IsNullOrWhiteSpace(line))
                continue;

            result.TotalRows++;
            var cells = ParseCsvLine(line);
            var reg = cells.ElementAtOrDefault(0)?.Trim();

            if (string.IsNullOrWhiteSpace(reg))
            {
                result.Failed++;
                result.Rows.Add(new ImportRowResult { RowNumber = rowNumber, Success = false, Error = "RegistrationNumber is required." });
                continue;
            }

            try
            {
                var vehicle = new Vehicle
                {
                    RegistrationNumber = reg,
                    VIN = cells.ElementAtOrDefault(1)?.Trim() ?? string.Empty,
                    Model = cells.ElementAtOrDefault(2)?.Trim() ?? string.Empty,
                    Year = ParseInt(cells.ElementAtOrDefault(3)),
                    FleetId = ParseInt(cells.ElementAtOrDefault(4)),
                    ManufacturerId = ParseInt(cells.ElementAtOrDefault(5)),
                    Color = cells.ElementAtOrDefault(6)?.Trim() ?? string.Empty,
                    Mileage = ParseDecimal(cells.ElementAtOrDefault(7)),
                    Status = string.IsNullOrWhiteSpace(cells.ElementAtOrDefault(8)) ? "Active" : cells[8].Trim(),
                    TenantId = tenantId.Value
                };
                await _vehicleService.CreateVehicleAsync(vehicle);
                result.Imported++;
                result.Rows.Add(new ImportRowResult { RowNumber = rowNumber, Success = true, Identifier = reg });
            }
            catch (Exception ex)
            {
                result.Failed++;
                result.Rows.Add(new ImportRowResult { RowNumber = rowNumber, Success = false, Identifier = reg, Error = ex.Message });
            }
        }

        return Ok(result);
    }

    private static int ParseInt(string? value)
        => int.TryParse(value?.Trim(), out var i) ? i : 0;

    private static decimal ParseDecimal(string? value)
        => decimal.TryParse(value?.Trim(), out var d) ? d : 0m;

    // Minimal CSV field parser supporting double-quoted fields and escaped quotes.
    private static List<string> ParseCsvLine(string line)
    {
        var fields = new List<string>();
        var sb = new System.Text.StringBuilder();
        var inQuotes = false;
        for (var i = 0; i < line.Length; i++)
        {
            var c = line[i];
            if (inQuotes)
            {
                if (c == '"')
                {
                    if (i + 1 < line.Length && line[i + 1] == '"') { sb.Append('"'); i++; }
                    else inQuotes = false;
                }
                else sb.Append(c);
            }
            else
            {
                if (c == '"') inQuotes = true;
                else if (c == ',') { fields.Add(sb.ToString()); sb.Clear(); }
                else sb.Append(c);
            }
        }
        fields.Add(sb.ToString());
        return fields;
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "CanEdit")]
    public async Task<ActionResult<VehicleDetailViewModel>> UpdateVehicle(int id, [FromBody] UpdateVehicleViewModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (id != model.Id)
            return BadRequest("ID mismatch");

        var existing = await _vehicleService.GetVehicleByIdAsync(id);
        if (existing == null)
            return NotFound($"Vehicle with ID {id} not found");
        if (!CanAccessTenant(existing.TenantId))
            return Forbid();

        existing.FleetId = model.FleetId;
        existing.ManufacturerId = model.ManufacturerId;
        existing.RegistrationNumber = model.RegistrationNumber;
        existing.VIN = model.VIN;
        existing.Model = model.Model;
        existing.Year = model.Year;
        existing.Color = model.Color;
        existing.Mileage = model.Mileage;
        existing.Status = model.Status;
        existing.PurchaseDate = model.PurchaseDate;
        existing.LastServiceDate = model.LastServiceDate;

        var updated = await _vehicleService.UpdateVehicleAsync(existing);
        return Ok(MapToDetailViewModel(updated));
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "CanDelete")]
    public async Task<ActionResult> DeleteVehicle(int id)
    {
        var existing = await _vehicleService.GetVehicleByIdAsync(id);
        if (existing == null)
            return NotFound($"Vehicle with ID {id} not found");
        if (!CanAccessTenant(existing.TenantId))
            return Forbid();

        var result = await _vehicleService.DeleteVehicleAsync(id);
        return result ? NoContent() : NotFound($"Vehicle with ID {id} not found");
    }

    // ----- Tenant isolation helpers -----

    private bool CanAccessTenant(int tenantId)
        => User.IsSystemAdmin() || User.GetTenantId() == tenantId;

    private IEnumerable<Vehicle> ApplyTenantScope(IEnumerable<Vehicle> vehicles)
    {
        if (User.IsSystemAdmin())
            return vehicles;
        var tenantId = User.GetTenantId();
        return tenantId is null ? Enumerable.Empty<Vehicle>() : vehicles.Where(v => v.TenantId == tenantId);
    }

    // ----- Mapping helpers -----

    private static VehicleListViewModel MapToListViewModel(Vehicle v) => new()
    {
        Id = v.Id,
        RegistrationNumber = v.RegistrationNumber,
        Model = v.Model,
        Year = v.Year,
        Status = v.Status,
        Mileage = v.Mileage,
        ManufacturerName = v.Manufacturer?.Name,
        FleetName = v.Fleet?.Name
    };

    private static VehicleDetailViewModel MapToDetailViewModel(Vehicle v) => new()
    {
        Id = v.Id,
        FleetId = v.FleetId,
        FleetName = v.Fleet?.Name,
        ManufacturerId = v.ManufacturerId,
        ManufacturerName = v.Manufacturer?.Name,
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
    };
}
