using System.ComponentModel.DataAnnotations;

namespace Fleet.Core.ViewModels.Onboarding;

/// <summary>
/// Payload used to consume an email verification token and activate the
/// associated account.
/// </summary>
public class VerifyEmailRequest
{
    [Required]
    public string Token { get; set; } = string.Empty;
}

/// <summary>
/// Payload used to request a fresh verification email for an unverified account.
/// </summary>
public class ResendVerificationRequest
{
    [Required]
    [EmailAddress]
    [StringLength(200)]
    public string Email { get; set; } = string.Empty;
}
