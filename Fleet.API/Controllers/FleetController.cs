using Fleet.Core.Common;
using Fleet.Core.Services;
using Fleet.Core.ViewModels.Fleets;
using Fleet.Core.ViewModels.Import;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Fleet.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FleetController : ControllerBase
{
    private readonly IFleetService _fleetService;

    public FleetController(IFleetService fleetService)
    {
        _fleetService = fleetService;
    }

    [HttpGet]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<PagedResult<FleetListViewModel>>> GetAllFleets([FromQuery] FleetQuery query)
    {
        var fleets = ApplyTenantScope(await _fleetService.GetAllFleetsAsync());

        if (query.IsActive.HasValue)
        {
            fleets = fleets.Where(f => f.IsActive == query.IsActive.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim();
            fleets = fleets.Where(f =>
                (f.Name?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false) ||
                (f.Location?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false) ||
                (f.Description?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false));
        }

        var vms = fleets
            .OrderBy(f => f.Name)
            .Select(MapToListViewModel);
        return Ok(PagedResult<FleetListViewModel>.Create(vms, query.Page, query.PageSize));
    }

    [HttpGet("{id}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<FleetDetailViewModel>> GetFleetById(int id)
    {
        var fleet = await _fleetService.GetFleetByIdAsync(id);
        if (fleet == null)
            return NotFound($"Fleet with ID {id} not found");

        if (!CanAccessTenant(fleet.TenantId))
            return Forbid();

        return Ok(MapToDetailViewModel(fleet));
    }

    [HttpGet("tenant/{tenantId}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<PagedResult<FleetListViewModel>>> GetFleetsByTenantId(int tenantId, [FromQuery] PaginationQuery pagination)
    {
        if (!CanAccessTenant(tenantId))
            return Forbid();

        var fleets = await _fleetService.GetFleetsByTenantIdAsync(tenantId);
        var vms = fleets.Select(MapToListViewModel);
        return Ok(PagedResult<FleetListViewModel>.Create(vms, pagination.Page, pagination.PageSize));
    }

    [HttpGet("active")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<PagedResult<FleetListViewModel>>> GetActiveFleets([FromQuery] PaginationQuery pagination)
    {
        var fleets = await _fleetService.GetActiveFleetsAsync();
        fleets = ApplyTenantScope(fleets);

        var vms = fleets.Select(MapToListViewModel);
        return Ok(PagedResult<FleetListViewModel>.Create(vms, pagination.Page, pagination.PageSize));
    }

    [HttpPost]
    [Authorize(Policy = "RequireManager")]
    public async Task<ActionResult<FleetDetailViewModel>> CreateFleet([FromBody] CreateFleetViewModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // Non-SystemAdmins may only create fleets within their own tenant
        var tenantId = model.TenantId;
        if (!User.IsSystemAdmin())
        {
            var callerTenant = User.GetTenantId();
            if (callerTenant is null)
                return Forbid();
            tenantId = callerTenant.Value;
        }

        var fleet = new Core.Domain.Fleet
        {
            Name = model.Name,
            Description = model.Description,
            Location = model.Location,
            IsActive = model.IsActive,
            TenantId = tenantId
        };

        var created = await _fleetService.CreateFleetAsync(fleet);
        return CreatedAtAction(nameof(GetFleetById), new { id = created.Id }, MapToDetailViewModel(created));
    }

    // Bulk-import fleets from a CSV upload. Every row is stamped with the caller's
    // tenant; the file never supplies a TenantId. Header: Name,Description,Location,IsActive
    [HttpPost("import")]
    [Authorize(Policy = "RequireManager")]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<ActionResult<ImportResult>> ImportFleets(IFormFile file)
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
            var name = cells.ElementAtOrDefault(0)?.Trim();

            if (string.IsNullOrWhiteSpace(name))
            {
                result.Failed++;
                result.Rows.Add(new ImportRowResult { RowNumber = rowNumber, Success = false, Error = "Name is required." });
                continue;
            }

            try
            {
                var fleet = new Core.Domain.Fleet
                {
                    Name = name,
                    Description = cells.ElementAtOrDefault(1)?.Trim() ?? string.Empty,
                    Location = cells.ElementAtOrDefault(2)?.Trim() ?? string.Empty,
                    IsActive = ParseBool(cells.ElementAtOrDefault(3), true),
                    TenantId = tenantId.Value
                };
                await _fleetService.CreateFleetAsync(fleet);
                result.Imported++;
                result.Rows.Add(new ImportRowResult { RowNumber = rowNumber, Success = true, Identifier = name });
            }
            catch (Exception ex)
            {
                result.Failed++;
                result.Rows.Add(new ImportRowResult { RowNumber = rowNumber, Success = false, Identifier = name, Error = ex.Message });
            }
        }

        return Ok(result);
    }

    private static bool ParseBool(string? value, bool fallback)
    {
        if (string.IsNullOrWhiteSpace(value)) return fallback;
        value = value.Trim();
        if (bool.TryParse(value, out var b)) return b;
        return value is "1" or "yes" or "y" or "Y" or "Yes" or "TRUE";
    }

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
    [Authorize(Policy = "RequireManager")]
    public async Task<ActionResult<FleetDetailViewModel>> UpdateFleet(int id, [FromBody] UpdateFleetViewModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (id != model.Id)
            return BadRequest("ID mismatch");

        var existing = await _fleetService.GetFleetByIdAsync(id);
        if (existing == null)
            return NotFound($"Fleet with ID {id} not found");

        if (!CanAccessTenant(existing.TenantId))
            return Forbid();

        existing.Name = model.Name;
        existing.Description = model.Description;
        existing.Location = model.Location;
        existing.IsActive = model.IsActive;

        var updated = await _fleetService.UpdateFleetAsync(existing);
        return Ok(MapToDetailViewModel(updated));
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "CanDelete")]
    public async Task<ActionResult> DeleteFleet(int id)
    {
        var existing = await _fleetService.GetFleetByIdAsync(id);
        if (existing == null)
            return NotFound($"Fleet with ID {id} not found");

        if (!CanAccessTenant(existing.TenantId))
            return Forbid();

        var result = await _fleetService.DeleteFleetAsync(id);
        return result ? NoContent() : NotFound($"Fleet with ID {id} not found");
    }

    // ----- Tenant isolation helpers -----

    private bool CanAccessTenant(int tenantId)
        => User.IsSystemAdmin() || User.GetTenantId() == tenantId;

    private IEnumerable<Core.Domain.Fleet> ApplyTenantScope(IEnumerable<Core.Domain.Fleet> fleets)
    {
        if (User.IsSystemAdmin())
            return fleets;

        var tenantId = User.GetTenantId();
        return tenantId is null ? Enumerable.Empty<Core.Domain.Fleet>() : fleets.Where(f => f.TenantId == tenantId);
    }

    // ----- Mapping helpers -----

    private static FleetListViewModel MapToListViewModel(Core.Domain.Fleet f) => new()
    {
        Id = f.Id,
        Name = f.Name,
        Location = f.Location,
        IsActive = f.IsActive,
        VehicleCount = f.Vehicles?.Count ?? 0
    };

    private static FleetDetailViewModel MapToDetailViewModel(Core.Domain.Fleet f) => new()
    {
        Id = f.Id,
        Name = f.Name,
        Description = f.Description,
        Location = f.Location,
        IsActive = f.IsActive,
        TenantId = f.TenantId,
        TenantName = f.Tenant?.Name,
        VehicleCount = f.Vehicles?.Count ?? 0,
        CreatedAt = f.CreatedAt,
        UpdatedAt = f.UpdatedAt
    };
}
