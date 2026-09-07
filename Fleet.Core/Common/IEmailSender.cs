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

/// <summary>
/// Strongly-typed SMTP configuration bound from the "Email:Smtp" section.
/// Secrets (host, credentials) must come from configuration/environment,
/// never hardcoded in source.
/// </summary>
public class SmtpOptions
{
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public bool UseSsl { get; set; } = true;
    public string? Username { get; set; }
    public string? Password { get; set; }
    public string FromAddress { get; set; } = string.Empty;
    public string FromName { get; set; } = "Fleet Maintenance";
}

/// <summary>
/// Production email sender that delivers messages over SMTP using
/// configuration-provided host and credentials.
/// </summary>
public class SmtpEmailSender : IEmailSender
{
    private readonly SmtpOptions _options;
    private readonly ILogger<SmtpEmailSender> _logger;

    public SmtpEmailSender(Microsoft.Extensions.Options.IOptions<SmtpOptions> options, ILogger<SmtpEmailSender> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public async Task SendAsync(string to, string subject, string body, CancellationToken cancellationToken = default)
    {
        using var message = new System.Net.Mail.MailMessage
        {
            From = new System.Net.Mail.MailAddress(_options.FromAddress, _options.FromName),
            Subject = subject,
            Body = body,
            IsBodyHtml = false
        };
        message.To.Add(to);

        using var client = new System.Net.Mail.SmtpClient(_options.Host, _options.Port)
        {
            EnableSsl = _options.UseSsl,
            DeliveryMethod = System.Net.Mail.SmtpDeliveryMethod.Network
        };

        if (!string.IsNullOrEmpty(_options.Username))
        {
            client.Credentials = new System.Net.NetworkCredential(_options.Username, _options.Password);
        }

        try
        {
            await client.SendMailAsync(message, cancellationToken);
            _logger.LogInformation("EMAIL (smtp) sent -> To: {To} | Subject: {Subject}", to, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send SMTP email to {To} | Subject: {Subject}", to, subject);
            throw;
        }
    }
}

