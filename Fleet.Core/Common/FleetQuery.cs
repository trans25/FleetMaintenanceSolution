namespace Fleet.Core.Common;

/// <summary>
/// Pagination request with optional free-text search and active-state filtering
/// applied server-side by the fleet list endpoint.
/// </summary>
public class FleetQuery : PaginationQuery
{
    /// <summary>
    /// Free-text search matched against fleet name, location, and description.
    /// </summary>
    public string? Search { get; set; }

    /// <summary>
    /// Optional active-state filter. When null, both active and inactive fleets are returned.
    /// </summary>
    public bool? IsActive { get; set; }
}
