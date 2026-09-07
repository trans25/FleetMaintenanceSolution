using System.ComponentModel.DataAnnotations;

namespace Fleet.Core.ViewModels.ComplianceDocuments;

public class CreateComplianceDocumentViewModel
{
    [Required]
    public int VehicleId { get; set; }

    [Required]
    [StringLength(100)]
    public string DocumentType { get; set; } = string.Empty;

    [Required]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;

    [StringLength(100)]
    public string? DocumentNumber { get; set; }

    [Required]
    public DateTime IssueDate { get; set; }

    [Required]
    public DateTime ExpiryDate { get; set; }

    [StringLength(2000)]
    public string? Notes { get; set; }
}
