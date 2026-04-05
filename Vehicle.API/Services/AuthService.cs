using Fleet.Core.Domain;
using Fleet.Core.Interfaces;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Vehicle.API.Services;

public interface IAuthService
{
    Task<AuthResult> AuthenticateAsync(string username, string password);
}

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IConfiguration _configuration;

    public AuthService(IUserRepository userRepository, IConfiguration configuration)
    {
        _userRepository = userRepository;
        _configuration = configuration;
    }

    public async Task<AuthResult> AuthenticateAsync(string username, string password)
    {
        if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
            return AuthResult.Failed("Username and password are required");

        var user = await _userRepository.GetByUsernameAsync(username);
        
        if (user == null || !user.IsActive)
            return AuthResult.Failed("Invalid credentials");

        if (!VerifyPassword(password, user.PasswordHash))
            return AuthResult.Failed("Invalid credentials");

        var token = GenerateJwtToken(user);

        return AuthResult.Success(
            token,
            user.Username,
            user.Email,
            user.Roles.Select(r => r.Name).ToList()
        );
    }

    private string GenerateJwtToken(User user)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey is not configured");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim("TenantId", user.TenantId.ToString())
        };

        foreach (var role in user.Roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role.Name));
        }

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(int.Parse(jwtSettings["ExpirationMinutes"] ?? "60")),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private bool VerifyPassword(string password, string passwordHash)
    {
         // TODO: Elias to unComment it out   in production
        // return BCrypt.Net.BCrypt.Verify(password, passwordHash);
        
        // TODO: Elias to Comment it out   in production
        return password == passwordHash;
    }
}

public class AuthResult
{
    public bool IsSuccess { get; set; }
    public string? ErrorMessage { get; set; }
    public string? Token { get; set; }
    public string? Username { get; set; }
    public string? Email { get; set; }
    public List<string> Roles { get; set; } = new();

    public static AuthResult Success(string token, string username, string email, List<string> roles)
    {
        return new AuthResult
        {
            IsSuccess = true,
            Token = token,
            Username = username,
            Email = email,
            Roles = roles
        };
    }

    public static AuthResult Failed(string errorMessage)
    {
        return new AuthResult
        {
            IsSuccess = false,
            ErrorMessage = errorMessage
        };
    }
}
