using Fleet.Core.Domain;
using Fleet.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Vehicle.API.ViewModels;

namespace Vehicle.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TenantController : ControllerBase
{
    private readonly ITenantRepository _tenantRepository;

    public TenantController(ITenantRepository tenantRepository)
    {
        _tenantRepository = tenantRepository;
    }

    [HttpGet]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<IEnumerable<Tenant>>> GetAllTenants()
    {
        var tenants = await _tenantRepository.GetAllAsync();
        return Ok(tenants);
    }

    [HttpGet("{id}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<Tenant>> GetTenantById(int id)
    {
        var tenant = await _tenantRepository.GetByIdAsync(id);
        return tenant == null ? NotFound($"Tenant with ID {id} not found") : Ok(tenant);
    }

    [HttpGet("active")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<IEnumerable<Tenant>>> GetActiveTenants()
    {
        var tenants = await _tenantRepository.GetActiveTenantsAsync();
        return Ok(tenants);
    }

    [HttpPost]
    [Authorize(Policy = "RequireSystemAdmin")]
    public async Task<ActionResult<Tenant>> CreateTenant([FromBody] CreateTenantViewModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var tenant = new Tenant
        {
            Name = model.Name,
            ContactEmail = model.ContactEmail,
            ContactPhone = model.ContactPhone,
            IsActive = model.IsActive
        };

        var createdTenant = await _tenantRepository.AddAsync(tenant);
        return CreatedAtAction(nameof(GetTenantById), new { id = createdTenant.Id }, createdTenant);
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "RequireSystemAdmin")]
    public async Task<ActionResult<Tenant>> UpdateTenant(int id, [FromBody] UpdateTenantViewModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (id != model.Id)
            return BadRequest("ID mismatch");

        var existingTenant = await _tenantRepository.GetByIdAsync(id);
        if (existingTenant == null)
            return NotFound($"Tenant with ID {id} not found");

        var tenant = new Tenant
        {
            Id = model.Id,
            Name = model.Name,
            ContactEmail = model.ContactEmail,
            ContactPhone = model.ContactPhone,
            IsActive = model.IsActive
        };

        var updatedTenant = await _tenantRepository.UpdateAsync(tenant);
        return Ok(updatedTenant);
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "RequireSystemAdmin")]
    public async Task<ActionResult> DeleteTenant(int id)
    {
        var tenant = await _tenantRepository.GetByIdAsync(id);
        if (tenant == null)
            return NotFound($"Tenant with ID {id} not found");

        await _tenantRepository.DeleteAsync(id);
        return NoContent();
    }
}
