using Fleet.Core.Domain;
using Fleet.Core.Services;
using Fleet.Core.ViewModels.Roles;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Auth.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "RequireSystemAdmin")]
public class RoleController : ControllerBase
{
    private readonly IRoleService _roleService;

    public RoleController(IRoleService roleService)
    {
        _roleService = roleService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<RoleListViewModel>>> GetAllRoles()
    {
        var roles = await _roleService.GetAllRolesAsync();
        return Ok(roles.Select(MapToListViewModel));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<RoleListViewModel>> GetRoleById(int id)
    {
        var role = await _roleService.GetRoleByIdAsync(id);
        return role == null ? NotFound($"Role with ID {id} not found") : Ok(MapToListViewModel(role));
    }

    [HttpPost]
    public async Task<ActionResult<RoleListViewModel>> CreateRole([FromBody] CreateRoleViewModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (await _roleService.GetRoleByNameAsync(model.Name) != null)
            return Conflict($"Role '{model.Name}' already exists.");

        var role = new Role
        {
            Name = model.Name,
            Description = model.Description
        };

        var created = await _roleService.CreateRoleAsync(role);
        return CreatedAtAction(nameof(GetRoleById), new { id = created.Id }, MapToListViewModel(created));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<RoleListViewModel>> UpdateRole(int id, [FromBody] UpdateRoleViewModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (id != model.Id)
            return BadRequest("ID mismatch");

        var role = await _roleService.GetRoleByIdAsync(id);
        if (role == null)
            return NotFound($"Role with ID {id} not found");

        role.Name = model.Name;
        role.Description = model.Description;

        var updated = await _roleService.UpdateRoleAsync(role);
        return Ok(MapToListViewModel(updated));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteRole(int id)
    {
        var result = await _roleService.DeleteRoleAsync(id);
        return result ? NoContent() : NotFound($"Role with ID {id} not found");
    }

    private static RoleListViewModel MapToListViewModel(Role role) => new()
    {
        Id = role.Id,
        Name = role.Name,
        Description = role.Description
    };
}
