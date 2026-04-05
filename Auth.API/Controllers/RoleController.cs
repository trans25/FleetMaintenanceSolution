using Fleet.Core.Domain;
using Fleet.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Auth.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RoleController : ControllerBase
{
    private readonly IRoleRepository _roleRepository;

    public RoleController(IRoleRepository roleRepository)
    {
        _roleRepository = roleRepository;
    }

    [HttpGet]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<IEnumerable<Role>>> GetAllRoles()
    {
        var roles = await _roleRepository.GetAllAsync();
        return Ok(roles);
    }

    [HttpGet("{id}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<Role>> GetRoleById(int id)
    {
        var role = await _roleRepository.GetByIdAsync(id);
        return role == null ? NotFound($"Role with ID {id} not found") : Ok(role);
    }
}
