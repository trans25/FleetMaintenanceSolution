namespace Fleet.Core.Common;

/// <summary>
/// Pagination request with optional free-text search and status filtering
/// applied server-side by list endpoints.
/// </summary>
public class VehicleQuery : PaginationQuery
{
    /// <summary>
    /// Free-text search matched against registration number, model, and VIN.
    /// </summary>
    public string? Search { get; set; }

    /// <summary>
    /// Optional exact status filter (e.g. Available, Maintenance).
    /// </summary>
    public string? Status { get; set; }
}
