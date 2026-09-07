using Fleet.Core.ViewModels.Onboarding;

namespace Fleet.Core.Services;

/// <summary>
/// Handles self-service tenant onboarding: atomically creating a tenant and its
/// first TenantAdmin user, issuing an email-verification token, and consuming
/// that token to activate the account.
/// </summary>
public interface ITenantOnboardingService
{
    /// <summary>
    /// Creates a new tenant plus its first (inactive) TenantAdmin user in a
    /// single transaction and sends a verification email.
    /// </summary>
    Task<TenantOnboardingResult> OnboardAsync(TenantOnboardingRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Consumes a verification token, activating the associated user account.
    /// Returns false if the token is missing, expired, or already used.
    /// </summary>
    Task<bool> VerifyEmailAsync(string token, CancellationToken cancellationToken = default);

    /// <summary>
    /// Re-issues a verification email for an unverified account. Always succeeds
    /// silently (does not reveal whether the email exists) unless already active.
    /// </summary>
    Task ResendVerificationAsync(string email, CancellationToken cancellationToken = default);
}
