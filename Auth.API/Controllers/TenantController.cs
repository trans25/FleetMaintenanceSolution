using Fleet.Core.Domain;
using Fleet.Core.Services;
using Fleet.Core.ViewModels.Tenants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Auth.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "RequireSystemAdmin")]
public class TenantController : ControllerBase
{
    private readonly ITenantService _tenantService;

    public TenantController(ITenantService tenantService)
    {
        _tenantService = tenantService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TenantListViewModel>>> GetAllTenants()
    {
        var tenants = await _tenantService.GetAllTenantsAsync();
        return Ok(tenants.Select(MapToListViewModel));
    }

    [HttpGet("active")]
    public async Task<ActionResult<IEnumerable<TenantListViewModel>>> GetActiveTenants()
    {
        var tenants = await _tenantService.GetActiveTenantsAsync();
        return Ok(tenants.Select(MapToListViewModel));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TenantListViewModel>> GetTenantById(int id)
    {
        var tenant = await _tenantService.GetTenantByIdAsync(id);
        return tenant == null ? NotFound($"Tenant with ID {id} not found") : Ok(MapToListViewModel(tenant));
    }

    [HttpPost]
    public async Task<ActionResult<TenantListViewModel>> CreateTenant([FromBody] CreateTenantViewModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (await _tenantService.GetTenantByNameAsync(model.Name) != null)
            return Conflict($"Tenant '{model.Name}' already exists.");

        var tenant = new Tenant
        {
            Name = model.Name,
            ContactEmail = model.ContactEmail,
            ContactPhone = model.ContactPhone,
            IsActive = model.IsActive
        };

        var created = await _tenantService.CreateTenantAsync(tenant);
        return CreatedAtAction(nameof(GetTenantById), new { id = created.Id }, MapToListViewModel(created));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<TenantListViewModel>> UpdateTenant(int id, [FromBody] UpdateTenantViewModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (id != model.Id)
            return BadRequest("ID mismatch");

        var tenant = await _tenantService.GetTenantByIdAsync(id);
        if (tenant == null)
            return NotFound($"Tenant with ID {id} not found");

        tenant.Name = model.Name;
        tenant.ContactEmail = model.ContactEmail;
        tenant.ContactPhone = model.ContactPhone;
        tenant.IsActive = model.IsActive;

        var updated = await _tenantService.UpdateTenantAsync(tenant);
        return Ok(MapToListViewModel(updated));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteTenant(int id)
    {
        var result = await _tenantService.DeleteTenantAsync(id);
        return result ? NoContent() : NotFound($"Tenant with ID {id} not found");
    }

    private static TenantListViewModel MapToListViewModel(Tenant tenant) => new()
    {
        Id = tenant.Id,
        Name = tenant.Name,
        ContactEmail = tenant.ContactEmail,
        IsActive = tenant.IsActive
    };
}
