namespace Fleet.Core.Common;

/// <summary>
/// Pagination request with optional free-text search, status, and priority
/// filtering applied server-side by the job card list endpoint.
/// </summary>
public class JobCardQuery : PaginationQuery
{
    /// <summary>
    /// Free-text search matched against job number, title, description, and vehicle registration.
    /// </summary>
    public string? Search { get; set; }

    /// <summary>
    /// Optional exact status filter (e.g. Open, InProgress, Completed, Cancelled).
    /// </summary>
    public string? Status { get; set; }

    /// <summary>
    /// Optional exact priority filter (e.g. Low, Medium, High, Critical).
    /// </summary>
    public string? Priority { get; set; }
}
