using Fleet.Core.Domain;
using Fleet.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Auth.API.ViewModels;
using BCrypt.Net;

namespace Auth.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UserController : ControllerBase
{
    private readonly IUserRepository _userRepository;
    private readonly IRoleRepository _roleRepository;

    public UserController(IUserRepository userRepository, IRoleRepository roleRepository)
    {
        _userRepository = userRepository;
        _roleRepository = roleRepository;
    }

    [HttpGet]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<IEnumerable<User>>> GetAllUsers()
    {
        var users = await _userRepository.GetAllAsync();
        return Ok(users);
    }

    [HttpGet("{id}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<User>> GetUserById(int id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        return user == null ? NotFound($"User with ID {id} not found") : Ok(user);
    }

    [HttpGet("tenant/{tenantId}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<IEnumerable<User>>> GetUsersByTenant(int tenantId)
    {
        var users = await _userRepository.GetUsersByTenantIdAsync(tenantId);
        return Ok(users);
    }

    [HttpPost]
    [Authorize(Policy = "RequireAdmin")]
    public async Task<ActionResult<User>> CreateUser([FromBody] CreateUserViewModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // Check if username already exists
        var existingUser = await _userRepository.GetByUsernameAsync(model.Username);
        if (existingUser != null)
            return BadRequest($"Username '{model.Username}' already exists");

        // Check if email already exists
        existingUser = await _userRepository.GetByEmailAsync(model.Email);
        if (existingUser != null)
            return BadRequest($"Email '{model.Email}' already exists");

        // Hash the password
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(model.Password);

        var user = new User
        {
            TenantId = model.TenantId,
            Username = model.Username,
            Email = model.Email,
            PasswordHash = passwordHash,
            FirstName = model.FirstName,
            LastName = model.LastName,
            IsActive = model.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        // Get roles
        if (model.RoleIds.Any())
        {
            var roles = await _roleRepository.GetAllAsync();
            user.Roles = roles.Where(r => model.RoleIds.Contains(r.Id)).ToList();
        }

        var createdUser = await _userRepository.AddAsync(user);
        return CreatedAtAction(nameof(GetUserById), new { id = createdUser.Id }, createdUser);
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "RequireAdmin")]
    public async Task<ActionResult<User>> UpdateUser(int id, [FromBody] UpdateUserViewModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (id != model.Id)
            return BadRequest("ID mismatch");

        var existingUser = await _userRepository.GetByIdAsync(id);
        if (existingUser == null)
            return NotFound($"User with ID {id} not found");

        // Check if username is taken by another user
        var userWithUsername = await _userRepository.GetByUsernameAsync(model.Username);
        if (userWithUsername != null && userWithUsername.Id != id)
            return BadRequest($"Username '{model.Username}' is already taken");

        // Check if email is taken by another user
        var userWithEmail = await _userRepository.GetByEmailAsync(model.Email);
        if (userWithEmail != null && userWithEmail.Id != id)
            return BadRequest($"Email '{model.Email}' is already taken");

        // Update user properties
        existingUser.TenantId = model.TenantId;
        existingUser.Username = model.Username;
        existingUser.Email = model.Email;
        existingUser.FirstName = model.FirstName;
        existingUser.LastName = model.LastName;
        existingUser.IsActive = model.IsActive;
        existingUser.UpdatedAt = DateTime.UtcNow;

        // Update password only if provided
        if (!string.IsNullOrEmpty(model.Password))
        {
            existingUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword(model.Password);
        }

        // Update roles
        existingUser.Roles.Clear();
        if (model.RoleIds.Any())
        {
            var roles = await _roleRepository.GetAllAsync();
            var selectedRoles = roles.Where(r => model.RoleIds.Contains(r.Id)).ToList();
            foreach (var role in selectedRoles)
            {
                existingUser.Roles.Add(role);
            }
        }

        var updatedUser = await _userRepository.UpdateAsync(existingUser);
        return Ok(updatedUser);
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "RequireSystemAdmin")]
    public async Task<ActionResult> DeleteUser(int id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null)
            return NotFound($"User with ID {id} not found");

        await _userRepository.DeleteAsync(id);
        return NoContent();
    }
}
