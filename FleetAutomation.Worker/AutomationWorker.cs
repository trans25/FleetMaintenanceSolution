using Fleet.Core.Automation;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace FleetAutomation.Worker;

/// <summary>
/// Timed background service that periodically runs the fleet automation rules
/// (service-due reminders, critical-fault escalation) and dispatches notifications.
/// </summary>
public class AutomationWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly AutomationOptions _options;
    private readonly ILogger<AutomationWorker> _logger;

    public AutomationWorker(
        IServiceScopeFactory scopeFactory,
        IOptions<AutomationOptions> options,
        ILogger<AutomationWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _options = options.Value;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_options.Enabled)
        {
            _logger.LogWarning("Fleet automation is disabled via configuration. Worker will idle.");
            return;
        }

        var interval = TimeSpan.FromMinutes(Math.Max(1, _options.PollIntervalMinutes));
        _logger.LogInformation("Fleet automation worker started. Poll interval: {Interval}.", interval);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var alertService = scope.ServiceProvider.GetRequiredService<IFleetAlertService>();
                var sent = await alertService.RunOnceAsync(stoppingToken);
                if (sent > 0)
                {
                    _logger.LogInformation("Automation cycle dispatched {Count} notification(s).", sent);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Automation cycle failed; will retry next interval.");
            }

            try
            {
                await Task.Delay(interval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }

        _logger.LogInformation("Fleet automation worker stopping.");
    }
}
