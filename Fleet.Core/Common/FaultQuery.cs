namespace Fleet.Core.Common;

/// <summary>
/// Pagination request with optional free-text search, status, and severity
/// filtering applied server-side by the fault list endpoint.
/// </summary>
public class FaultQuery : PaginationQuery
{
    /// <summary>
    /// Free-text search matched against fault title, description, and vehicle registration.
    /// </summary>
    public string? Search { get; set; }

    /// <summary>
    /// Optional exact status filter (e.g. Open, InProgress, Resolved).
    /// </summary>
    public string? Status { get; set; }

    /// <summary>
    /// Optional exact severity filter (e.g. Low, Medium, High, Critical).
    /// </summary>
    public string? Severity { get; set; }
}
