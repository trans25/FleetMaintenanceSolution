namespace Fleet.Core.Common;

/// <summary>
/// Pagination request with optional free-text search, document type, and expiry
/// filtering applied server-side by the compliance document list endpoint.
/// </summary>
public class ComplianceQuery : PaginationQuery
{
    /// <summary>
    /// Free-text search matched against document name, number, type, and vehicle registration.
    /// </summary>
    public string? Search { get; set; }

    /// <summary>
    /// Optional exact document type filter (e.g. LicenseDisk, Insurance, RoadworthyCertificate).
    /// </summary>
    public string? DocumentType { get; set; }

    /// <summary>
    /// Optional exact status filter (e.g. Valid, Expiring, Expired).
    /// </summary>
    public string? Status { get; set; }

    /// <summary>
    /// When true, returns only documents that have already expired.
    /// </summary>
    public bool? ExpiredOnly { get; set; }

    /// <summary>
    /// When set, returns only documents expiring within the given number of days from today.
    /// </summary>
    public int? ExpiringWithinDays { get; set; }
}
