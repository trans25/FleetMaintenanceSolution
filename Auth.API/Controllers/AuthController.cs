using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;
using Auth.API.Services;
using Fleet.Core.Common;
using Fleet.Core.Domain;
using Fleet.Core.Models.Identity;
using Fleet.Core.Security;
using Fleet.Core.Services;

namespace Auth.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IUserService _userService;
    private readonly IRoleService _roleService;
    private readonly ITokenStoreService _tokenStore;
    private readonly IEmailSender _emailSender;
    private readonly IConfiguration _configuration;

    public AuthController(
        IAuthService authService,
        IUserService userService,
        IRoleService roleService,
        ITokenStoreService tokenStore,
        IEmailSender emailSender,
        IConfiguration configuration)
    {
        _authService = authService;
        _userService = userService;
        _roleService = roleService;
        _tokenStore = tokenStore;
        _emailSender = emailSender;
        _configuration = configuration;
    }

    private TimeSpan RefreshTokenLifetime =>
        TimeSpan.FromDays(int.TryParse(_configuration["JwtSettings:RefreshTokenDays"], out var d) ? d : 7);

    private TimeSpan ResetTokenLifetime =>
        TimeSpan.FromHours(int.TryParse(_configuration["JwtSettings:ResetTokenHours"], out var h) ? h : 1);

    [HttpPost("login")]
    [EnableRateLimiting("auth")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        var result = await _authService.AuthenticateAsync(request.Username, request.Password);

        if (!result.IsSuccess)
            return Unauthorized(result.ErrorMessage);

        var refreshToken = await _tokenStore.CreateRefreshTokenAsync(result.UserId, RefreshTokenLifetime);

        return Ok(new LoginResponse
        {
            Token = result.Token!,
            RefreshToken = refreshToken.Token,
            Username = result.Username!,
            Email = result.Email!,
            Roles = result.Roles
        });
    }

    [HttpPost("register")]
    [EnableRateLimiting("auth")]
    public async Task<ActionResult> Register([FromBody] RegisterModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (await _userService.GetUserByUsernameAsync(model.Username) != null)
            return Conflict($"Username '{model.Username}' is already taken.");

        if (await _userService.GetUserByEmailAsync(model.Email) != null)
            return Conflict($"Email '{model.Email}' is already registered.");

        // Bootstrap: the very first user created becomes the SystemAdmin so the
        // platform has an administrator without manual DB seeding.
        var isFirstUser = !(await _userService.GetAllUsersAsync()).Any();

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

        if (isFirstUser)
        {
            var systemAdminRole = await _roleService.GetRoleByNameAsync("SystemAdmin");
            if (systemAdminRole != null)
                user.Roles.Add(systemAdminRole);
        }
        else
        {
            // Self-registered users receive a safe, limited default role so they
            // have usable (but non-privileged) access. Admins can elevate them
            // later via the Users API. Role selection is never client-controlled.
            var defaultRole = await _roleService.GetRoleByNameAsync("Staff");
            if (defaultRole != null)
                user.Roles.Add(defaultRole);
        }

        var created = await _userService.CreateUserAsync(user);

        return CreatedAtAction(nameof(Login), new
        {
            created.Id,
            created.Username,
            created.Email,
            IsSystemAdmin = isFirstUser,
            Roles = created.Roles.Select(r => r.Name).ToList()
        });
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<LoginResponse>> Refresh([FromBody] RefreshTokenRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
            return BadRequest("Refresh token is required.");

        var stored = await _tokenStore.GetRefreshTokenAsync(request.RefreshToken);
        if (stored is null || !stored.IsActive)
            return Unauthorized("Invalid or expired refresh token.");

        var user = await _userService.GetUserByIdAsync(stored.UserId);
        if (user is null || !user.IsActive)
            return Unauthorized("User is no longer active.");

        // Rotate the refresh token
        var newRefresh = await _tokenStore.CreateRefreshTokenAsync(user.Id, RefreshTokenLifetime);
        await _tokenStore.RevokeRefreshTokenAsync(stored, newRefresh.Token);

        var accessToken = _authService.GenerateJwtToken(user);

        return Ok(new LoginResponse
        {
            Token = accessToken,
            RefreshToken = newRefresh.Token,
            Username = user.Username,
            Email = user.Email,
            Roles = user.Roles.Select(r => r.Name).ToList()
        });
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<ActionResult> Logout([FromBody] RefreshTokenRequest request)
    {
        if (!string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            var stored = await _tokenStore.GetRefreshTokenAsync(request.RefreshToken);
            if (stored is not null && stored.IsActive)
                await _tokenStore.RevokeRefreshTokenAsync(stored);
        }

        return NoContent();
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        var user = await _userService.GetUserByIdAsync(userId);
        if (user == null)
            return Unauthorized();

        if (!PasswordHasher.Verify(model.CurrentPassword, user.PasswordHash))
            return BadRequest("Current password is incorrect.");

        user.PasswordHash = PasswordHasher.Hash(model.NewPassword);
        await _userService.UpdateUserAsync(user);

        // Invalidate existing sessions after a password change
        await _tokenStore.RevokeAllUserRefreshTokensAsync(user.Id);

        return NoContent();
    }

    [HttpPost("forgot-password")]
    [EnableRateLimiting("auth")]
    public async Task<ActionResult> ForgotPassword([FromBody] ForgotPasswordModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var user = await _userService.GetUserByEmailAsync(model.Email);
        if (user is not null && user.IsActive)
        {
            var resetToken = await _tokenStore.CreatePasswordResetTokenAsync(user.Id, ResetTokenLifetime);
            var resetLink = $"{_configuration["App:ResetPasswordUrl"] ?? "https://localhost/reset-password"}?token={Uri.EscapeDataString(resetToken.Token)}";
            await _emailSender.SendAsync(
                user.Email,
                "Password reset request",
                $"Use the following link to reset your password (valid for {ResetTokenLifetime.TotalHours} hour(s)):\n{resetLink}");
        }

        // Always return OK to avoid leaking which emails are registered.
        return Ok("If an account with that email exists, a password reset link has been sent.");
    }

    [HttpPost("reset-password")]
    public async Task<ActionResult> ResetPassword([FromBody] ResetPasswordModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var stored = await _tokenStore.GetPasswordResetTokenAsync(model.Token);
        if (stored is null || !stored.IsActive)
            return BadRequest("Invalid or expired password reset token.");

        var user = await _userService.GetUserByIdAsync(stored.UserId);
        if (user is null)
            return BadRequest("Invalid or expired password reset token.");

        user.PasswordHash = PasswordHasher.Hash(model.NewPassword);
        await _userService.UpdateUserAsync(user);

        await _tokenStore.MarkPasswordResetTokenUsedAsync(stored);
        await _tokenStore.RevokeAllUserRefreshTokensAsync(user.Id);

        return NoContent();
    }
}

// Request/Response models
public class LoginRequest
{
    // Accepts either a username or an email address
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class RefreshTokenRequest
{
    public string RefreshToken { get; set; } = string.Empty;
}

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public List<string> Roles { get; set; } = new();
}
