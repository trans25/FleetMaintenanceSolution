using Fleet.Core.Domain;

namespace Fleet.Core.Services;

public interface IComplianceDocumentService
{
    Task<IEnumerable<ComplianceDocument>> GetAllAsync();
    Task<ComplianceDocument?> GetByIdAsync(int id);
    Task<IEnumerable<ComplianceDocument>> GetByVehicleIdAsync(int vehicleId);
    Task<ComplianceDocument> CreateAsync(ComplianceDocument document);
    Task<ComplianceDocument> UpdateAsync(ComplianceDocument document);
    Task<bool> DeleteAsync(int id);

    /// <summary>
    /// Computes the lifecycle status of a document relative to a reference date:
    /// Expired, Expiring (within <paramref name="expiringWithinDays"/>), or Valid.
    /// </summary>
    string ComputeStatus(DateTime expiryDate, DateTime referenceDate, int expiringWithinDays = 30);
}
