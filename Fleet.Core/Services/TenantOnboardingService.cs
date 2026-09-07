using System.Security.Cryptography;
using Fleet.Core.Common;
using Fleet.Core.Data;
using Fleet.Core.Domain;
using Fleet.Core.Security;
using Fleet.Core.ViewModels.Onboarding;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Fleet.Core.Services;

/// <summary>
/// Default implementation of tenant self-onboarding. Creates the tenant and its
/// first TenantAdmin user atomically, keeps the account inactive until the work
/// email is verified, and manages verification tokens.
/// </summary>
public class TenantOnboardingService : ITenantOnboardingService
{
    private const string TenantAdminRoleName = "TenantAdmin";
    private static readonly TimeSpan TokenLifetime = TimeSpan.FromHours(24);

    private readonly ApplicationDbContext _context;
    private readonly IEmailSender _emailSender;
    private readonly IConfiguration _configuration;
    private readonly ILogger<TenantOnboardingService> _logger;

    public TenantOnboardingService(
        ApplicationDbContext context,
        IEmailSender emailSender,
        IConfiguration configuration,
        ILogger<TenantOnboardingService> logger)
    {
        _context = context;
        _emailSender = emailSender;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<TenantOnboardingResult> OnboardAsync(TenantOnboardingRequest request, CancellationToken cancellationToken = default)
    {
        var email = request.WorkEmail.Trim();
        var username = request.Username.Trim();
        var companyName = request.CompanyName.Trim();

        // Guard against duplicates before opening the transaction.
        if (await _context.Users.AnyAsync(u => u.Email == email, cancellationToken))
            throw new InvalidOperationException($"Email '{email}' is already registered.");

        if (await _context.Users.AnyAsync(u => u.Username == username, cancellationToken))
            throw new InvalidOperationException($"Username '{username}' is already taken.");

        if (await _context.Tenants.AnyAsync(t => t.Name == companyName, cancellationToken))
            throw new InvalidOperationException($"A company named '{companyName}' already exists.");

        var tenantAdminRole = await _context.Roles
            .FirstOrDefaultAsync(r => r.Name == TenantAdminRoleName, cancellationToken)
            ?? throw new InvalidOperationException($"Required role '{TenantAdminRoleName}' is not configured.");

        await using var transaction = _context.Database.IsRelational()
            ? await _context.Database.BeginTransactionAsync(cancellationToken)
            : null;
        try
        {
            var tenant = new Tenant
            {
                Name = companyName,
                ContactEmail = email,
                ContactPhone = request.ContactPhone?.Trim() ?? string.Empty,
                IsActive = true
            };
            _context.Tenants.Add(tenant);
            await _context.SaveChangesAsync(cancellationToken);

            var user = new User
            {
                Username = username,
                Email = email,
                PasswordHash = PasswordHasher.Hash(request.Password),
                FirstName = request.FirstName.Trim(),
                LastName = request.LastName.Trim(),
                TenantId = tenant.Id,
                IsActive = false // blocked from login until email verified
            };
            user.Roles.Add(tenantAdminRole);
            _context.Users.Add(user);
            await _context.SaveChangesAsync(cancellationToken);

            var verification = new EmailVerificationToken
            {
                UserId = user.Id,
                Token = GenerateToken(),
                ExpiresAt = DateTime.UtcNow.Add(TokenLifetime)
            };
            _context.EmailVerificationTokens.Add(verification);
            await _context.SaveChangesAsync(cancellationToken);

            if (transaction is not null)
                await transaction.CommitAsync(cancellationToken);

            var emailSent = await TrySendVerificationEmailAsync(email, verification.Token, cancellationToken);

            return new TenantOnboardingResult
            {
                TenantId = tenant.Id,
                UserId = user.Id,
                Email = email,
                VerificationEmailSent = emailSent,
                Message = "Company registered. Check your work email to verify your account before logging in."
            };
        }
        catch
        {
            if (transaction is not null)
                await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<bool> VerifyEmailAsync(string token, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(token))
            return false;

        var record = await _context.EmailVerificationTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Token == token, cancellationToken);

        if (record is null || !record.IsActive)
            return false;

        record.UsedAt = DateTime.UtcNow;
        record.UpdatedAt = DateTime.UtcNow;

        record.User.IsActive = true;
        record.User.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task ResendVerificationAsync(string email, CancellationToken cancellationToken = default)
    {
        var normalized = email.Trim();
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == normalized, cancellationToken);

        // Do not reveal whether the account exists, and never re-issue for
        // already-active accounts.
        if (user is null || user.IsActive)
            return;

        // Invalidate any outstanding tokens for this user.
        var outstanding = await _context.EmailVerificationTokens
            .Where(t => t.UserId == user.Id && t.UsedAt == null)
            .ToListAsync(cancellationToken);
        foreach (var t in outstanding)
        {
            t.UsedAt = DateTime.UtcNow;
            t.UpdatedAt = DateTime.UtcNow;
        }

        var verification = new EmailVerificationToken
        {
            UserId = user.Id,
            Token = GenerateToken(),
            ExpiresAt = DateTime.UtcNow.Add(TokenLifetime)
        };
        _context.EmailVerificationTokens.Add(verification);
        await _context.SaveChangesAsync(cancellationToken);

        await TrySendVerificationEmailAsync(user.Email, verification.Token, cancellationToken);
    }

    private async Task<bool> TrySendVerificationEmailAsync(string email, string token, CancellationToken cancellationToken)
    {
        try
        {
            var baseUrl = _configuration["App:VerifyEmailUrl"] ?? "https://localhost/verify-email";
            var link = $"{baseUrl}?token={Uri.EscapeDataString(token)}";
            var body =
                "Welcome to Fleet Maintenance!\n\n" +
                "Please verify your work email to activate your account and sign in:\n\n" +
                link + "\n\n" +
                "This link expires in 24 hours. If you did not request this, you can ignore this email.";

            await _emailSender.SendAsync(email, "Verify your Fleet Maintenance account", body, cancellationToken);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send verification email to {Email}", email);
            return false;
        }
    }

    private static string GenerateToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToHexString(bytes);
    }
}
