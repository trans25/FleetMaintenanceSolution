using Fleet.Core.Domain;
using Fleet.Core.Services;
using Fleet.Core.ViewModels.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Auth.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "RequireAdmin")]
public class UserController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IRoleService _roleService;

    public UserController(IUserService userService, IRoleService roleService)
    {
        _userService = userService;
        _roleService = roleService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserListViewModel>>> GetAllUsers()
    {
        var users = await _userService.GetAllUsersAsync();
        return Ok(users.Select(MapToListViewModel));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserDetailViewModel>> GetUserById(int id)
    {
        var user = await _userService.GetUserByIdAsync(id);
        return user == null ? NotFound($"User with ID {id} not found") : Ok(MapToDetailViewModel(user));
    }

    [HttpGet("tenant/{tenantId}")]
    public async Task<ActionResult<IEnumerable<UserListViewModel>>> GetUsersByTenantId(int tenantId)
    {
        var users = await _userService.GetUsersByTenantIdAsync(tenantId);
        return Ok(users.Select(MapToListViewModel));
    }

    [HttpPost]
    public async Task<ActionResult<UserDetailViewModel>> CreateUser([FromBody] CreateUserViewModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (await _userService.GetUserByUsernameAsync(model.Username) != null)
            return Conflict($"Username '{model.Username}' is already taken.");

        if (await _userService.GetUserByEmailAsync(model.Email) != null)
            return Conflict($"Email '{model.Email}' is already registered.");

        var user = new User
        {
            Username = model.Username,
            Email = model.Email,
            PasswordHash = model.Password, // hashed inside UserService.CreateUserAsync
            FirstName = model.FirstName,
            LastName = model.LastName,
            IsActive = model.IsActive,
            TenantId = model.TenantId,
            Roles = await ResolveRolesAsync(model.RoleIds)
        };

        var created = await _userService.CreateUserAsync(user);
        return CreatedAtAction(nameof(GetUserById), new { id = created.Id }, MapToDetailViewModel(created));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<UserDetailViewModel>> UpdateUser(int id, [FromBody] UpdateUserViewModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (id != model.Id)
            return BadRequest("ID mismatch");

        var user = await _userService.GetUserByIdAsync(id);
        if (user == null)
            return NotFound($"User with ID {id} not found");

        user.Username = model.Username;
        user.Email = model.Email;
        user.FirstName = model.FirstName;
        user.LastName = model.LastName;
        user.IsActive = model.IsActive;
        user.Roles = await ResolveRolesAsync(model.RoleIds);

        var updated = await _userService.UpdateUserAsync(user);
        return Ok(MapToDetailViewModel(updated));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteUser(int id)
    {
        var result = await _userService.DeleteUserAsync(id);
        return result ? NoContent() : NotFound($"User with ID {id} not found");
    }

    private async Task<List<Role>> ResolveRolesAsync(List<int> roleIds)
    {
        var roles = new List<Role>();
        foreach (var roleId in roleIds.Distinct())
        {
            var role = await _roleService.GetRoleByIdAsync(roleId);
            if (role != null)
                roles.Add(role);
        }
        return roles;
    }

    private static UserListViewModel MapToListViewModel(User user) => new()
    {
        Id = user.Id,
        Username = user.Username,
        Email = user.Email,
        FullName = $"{user.FirstName} {user.LastName}".Trim(),
        IsActive = user.IsActive,
        Roles = user.Roles.Select(r => r.Name).ToList()
    };

    private static UserDetailViewModel MapToDetailViewModel(User user) => new()
    {
        Id = user.Id,
        Username = user.Username,
        Email = user.Email,
        FirstName = user.FirstName,
        LastName = user.LastName,
        IsActive = user.IsActive,
        TenantId = user.TenantId,
        Roles = user.Roles.Select(r => r.Name).ToList(),
        CreatedAt = user.CreatedAt,
        UpdatedAt = user.UpdatedAt
    };
}
