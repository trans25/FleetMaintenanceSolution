using Fleet.Core.Domain;

namespace Fleet.Core.Services;

/// <summary>
/// Persistence-layer operations for refresh tokens and password reset tokens.
/// </summary>
public interface ITokenStoreService
{
    Task<RefreshToken> CreateRefreshTokenAsync(int userId, TimeSpan lifetime);
    Task<RefreshToken?> GetRefreshTokenAsync(string token);
    Task RevokeRefreshTokenAsync(RefreshToken token, string? replacedByToken = null);
    Task RevokeAllUserRefreshTokensAsync(int userId);

    Task<PasswordResetToken> CreatePasswordResetTokenAsync(int userId, TimeSpan lifetime);
    Task<PasswordResetToken?> GetPasswordResetTokenAsync(string token);
    Task MarkPasswordResetTokenUsedAsync(PasswordResetToken token);
}
