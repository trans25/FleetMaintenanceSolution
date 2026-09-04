namespace Fleet.Core.Domain;

/// <summary>
/// Persisted single-use token backing the forgot/reset password flow.
/// </summary>
public class PasswordResetToken : BaseEntity
{
    public int UserId { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime? UsedAt { get; set; }

    public User User { get; set; } = null!;

    public bool IsActive => UsedAt is null && DateTime.UtcNow < ExpiresAt;
}
