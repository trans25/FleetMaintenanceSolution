namespace Fleet.Core.ViewModels.ComplianceDocuments;

public class ComplianceDocumentListViewModel
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int VehicleId { get; set; }
    public string? VehicleRegistration { get; set; }
    public string DocumentType { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? DocumentNumber { get; set; }
    public DateTime IssueDate { get; set; }
    public DateTime ExpiryDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool HasFile { get; set; }
    public int DaysUntilExpiry { get; set; }
}
