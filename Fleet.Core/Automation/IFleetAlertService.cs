namespace Fleet.Core.Automation;

/// <summary>
/// Evaluates automation rules against current fleet data and dispatches
/// notifications for anything that needs attention.
/// </summary>
public interface IFleetAlertService
{
    /// <summary>
    /// Runs all enabled rules once. Returns the number of new notifications sent.
    /// </summary>
    Task<int> RunOnceAsync(CancellationToken cancellationToken = default);
}
