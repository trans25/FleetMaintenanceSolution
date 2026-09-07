using System.ComponentModel.DataAnnotations;

namespace Fleet.Core.ViewModels.Onboarding;

/// <summary>
/// Payload for public tenant self-onboarding. Creates a new tenant (company)
/// together with its first TenantAdmin user. The account remains inactive until
/// the work email is verified.
/// </summary>
public class TenantOnboardingRequest
{
    // Company / tenant details
    [Required]
    [StringLength(200)]
    public string CompanyName { get; set; } = string.Empty;

    [StringLength(50)]
    public string ContactPhone { get; set; } = string.Empty;

    // First administrator details
    [Required]
    [StringLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string LastName { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(200)]
    public string WorkEmail { get; set; } = string.Empty;

    [Required]
    [StringLength(100, MinimumLength = 6)]
    public string Password { get; set; } = string.Empty;

    [Required]
    [Compare(nameof(Password), ErrorMessage = "Passwords do not match.")]
    public string ConfirmPassword { get; set; } = string.Empty;
}
