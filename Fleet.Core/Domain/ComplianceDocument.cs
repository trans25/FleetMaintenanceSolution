namespace Fleet.Core.Domain;

/// <summary>
/// A compliance/regulatory document attached to a vehicle
/// (e.g. license disk, insurance certificate, roadworthy certificate).
/// Multi-tenant: each document belongs to a specific tenant for data isolation.
/// </summary>
public class ComplianceDocument : BaseTenantEntity
{
    public int VehicleId { get; set; }

    /// <summary>Document category, e.g. LicenseDisk, Insurance, RoadworthyCertificate, PermitDisc.</summary>
    public string DocumentType { get; set; } = string.Empty;

    /// <summary>Human-friendly document name/title.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Optional issuing authority or reference number.</summary>
    public string? DocumentNumber { get; set; }

    public DateTime IssueDate { get; set; }

    public DateTime ExpiryDate { get; set; }

    /// <summary>Lifecycle status: Valid, Expiring, Expired.</summary>
    public string Status { get; set; } = "Valid";

    public string? Notes { get; set; }

    /// <summary>Original file name of the attached document (optional).</summary>
    public string? FileName { get; set; }

    /// <summary>Storage key/relative path used by the file storage abstraction (optional).</summary>
    public string? FilePath { get; set; }

    /// <summary>MIME content type of the attached file (optional).</summary>
    public string? ContentType { get; set; }

    // Navigation properties
    public Vehicle Vehicle { get; set; } = null!;
}
