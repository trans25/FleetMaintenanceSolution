using Fleet.Core.Domain;

namespace Fleet.Core.Interfaces;

public interface IComplianceDocumentRepository : IRepository<ComplianceDocument>
{
    Task<IEnumerable<ComplianceDocument>> GetByVehicleIdAsync(int vehicleId);
    Task<IEnumerable<ComplianceDocument>> GetExpiringAsync(DateTime from, DateTime to);
    Task<IEnumerable<ComplianceDocument>> GetExpiredAsync(DateTime asOf);
    IQueryable<ComplianceDocument> Query();
}
