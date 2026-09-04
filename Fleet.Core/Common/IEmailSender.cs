using Microsoft.Extensions.Logging;

namespace Fleet.Core.Common;

/// <summary>
/// Abstraction for sending transactional emails (e.g. password reset).
/// Swap the implementation for a real SMTP/SendGrid provider in production.
/// </summary>
public interface IEmailSender
{
    Task SendAsync(string to, string subject, string body, CancellationToken cancellationToken = default);
}

/// <summary>
/// Development email sender that writes the message to the logs instead of
/// sending it. Provides a clear seam for a production provider.
/// </summary>
public class LoggingEmailSender : IEmailSender
{
    private readonly ILogger<LoggingEmailSender> _logger;

    public LoggingEmailSender(ILogger<LoggingEmailSender> logger)
    {
        _logger = logger;
    }

    public Task SendAsync(string to, string subject, string body, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("EMAIL (dev) -> To: {To} | Subject: {Subject}\n{Body}", to, subject, body);
        return Task.CompletedTask;
    }
}
