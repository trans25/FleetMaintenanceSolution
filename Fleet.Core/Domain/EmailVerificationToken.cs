namespace Fleet.Core.Domain;

/// <summary>
/// Persisted single-use token backing the email verification flow used during
/// tenant self-onboarding. The associated user cannot log in until the token
/// is consumed and the account is activated.
/// </summary>
public class EmailVerificationToken : BaseEntity
{
    public int UserId { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime? UsedAt { get; set; }

    public User User { get; set; } = null!;

    public bool IsActive => UsedAt is null && DateTime.UtcNow < ExpiresAt;
}
