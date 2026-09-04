using Microsoft.AspNetCore.Mvc;
using Auth.API.Services;
using Fleet.Core.Domain;
using Fleet.Core.Models.Identity;
using Fleet.Core.Services;

namespace Auth.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IUserService _userService;

    public AuthController(IAuthService authService, IUserService userService)
    {
        _authService = authService;
        _userService = userService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        var result = await _authService.AuthenticateAsync(request.Username, request.Password);

        if (!result.IsSuccess)
            return Unauthorized(result.ErrorMessage);

        return Ok(new LoginResponse
        {
            Token = result.Token!,
            Username = result.Username!,
            Email = result.Email!,
            Roles = result.Roles
        });
    }

    [HttpPost("register")]
    public async Task<ActionResult> Register([FromBody] RegisterModel model)
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
            TenantId = model.TenantId,
            IsActive = true
        };

        var created = await _userService.CreateUserAsync(user);

        return CreatedAtAction(nameof(Login), new
        {
            created.Id,
            created.Username,
            created.Email
        });
    }
}

// Request/Response models
public class LoginRequest
{
    // Accepts either a username or an email address
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public List<string> Roles { get; set; } = new();
}
