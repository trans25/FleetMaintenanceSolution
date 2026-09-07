namespace Fleet.Core.ViewModels.Onboarding;

/// <summary>
/// Result returned after a successful tenant onboarding request. No auth token
/// is issued yet; the user must verify their work email before logging in.
/// </summary>
public class TenantOnboardingResult
{
    public int TenantId { get; set; }
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public bool VerificationEmailSent { get; set; }
    public string Message { get; set; } = string.Empty;
}
