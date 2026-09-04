using System.Security.Cryptography;
using Fleet.Core.Data;
using Fleet.Core.Domain;
using Microsoft.EntityFrameworkCore;

namespace Fleet.Core.Services;

public class TokenStoreService : ITokenStoreService
{
    private readonly ApplicationDbContext _context;

    public TokenStoreService(ApplicationDbContext context)
    {
        _context = context;
    }

    private static string GenerateSecureToken()
        => Convert.ToBase64String(RandomNumberGenerator.GetBytes(48));

    public async Task<RefreshToken> CreateRefreshTokenAsync(int userId, TimeSpan lifetime)
    {
        var token = new RefreshToken
        {
            UserId = userId,
            Token = GenerateSecureToken(),
            ExpiresAt = DateTime.UtcNow.Add(lifetime)
        };
        _context.RefreshTokens.Add(token);
        await _context.SaveChangesAsync();
        return token;
    }

    public async Task<RefreshToken?> GetRefreshTokenAsync(string token)
        => await _context.RefreshTokens.FirstOrDefaultAsync(t => t.Token == token);

    public async Task RevokeRefreshTokenAsync(RefreshToken token, string? replacedByToken = null)
    {
        token.RevokedAt = DateTime.UtcNow;
        token.ReplacedByToken = replacedByToken;
        await _context.SaveChangesAsync();
    }

    public async Task RevokeAllUserRefreshTokensAsync(int userId)
    {
        var active = await _context.RefreshTokens
            .Where(t => t.UserId == userId && t.RevokedAt == null)
            .ToListAsync();
        foreach (var t in active)
        {
            t.RevokedAt = DateTime.UtcNow;
        }
        await _context.SaveChangesAsync();
    }

    public async Task<PasswordResetToken> CreatePasswordResetTokenAsync(int userId, TimeSpan lifetime)
    {
        var token = new PasswordResetToken
        {
            UserId = userId,
            Token = GenerateSecureToken(),
            ExpiresAt = DateTime.UtcNow.Add(lifetime)
        };
        _context.PasswordResetTokens.Add(token);
        await _context.SaveChangesAsync();
        return token;
    }

    public async Task<PasswordResetToken?> GetPasswordResetTokenAsync(string token)
        => await _context.PasswordResetTokens.FirstOrDefaultAsync(t => t.Token == token);

    public async Task MarkPasswordResetTokenUsedAsync(PasswordResetToken token)
    {
        token.UsedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }
}
