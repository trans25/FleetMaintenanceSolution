using Microsoft.AspNetCore.Mvc;
using Auth.API.Services;

namespace Auth.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
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
            TenantId = result.TenantId,
            Roles = result.Roles
        });
    }
}

// Request/Response models
public class LoginRequest
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int TenantId { get; set; }
    public List<string> Roles { get; set; } = new();
}
