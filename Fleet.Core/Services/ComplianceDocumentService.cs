using Fleet.Core.Domain;
using Fleet.Core.Interfaces;

namespace Fleet.Core.Services;

public class ComplianceDocumentService : IComplianceDocumentService
{
    private readonly IComplianceDocumentRepository _repository;

    public ComplianceDocumentService(IComplianceDocumentRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<ComplianceDocument>> GetAllAsync()
    {
        return await _repository.GetAllAsync();
    }

    public async Task<ComplianceDocument?> GetByIdAsync(int id)
    {
        return await _repository.GetByIdAsync(id);
    }

    public async Task<IEnumerable<ComplianceDocument>> GetByVehicleIdAsync(int vehicleId)
    {
        return await _repository.GetByVehicleIdAsync(vehicleId);
    }

    public async Task<ComplianceDocument> CreateAsync(ComplianceDocument document)
    {
        if (document.ExpiryDate < document.IssueDate)
            throw new InvalidOperationException("Expiry date cannot be earlier than the issue date.");

        document.CreatedAt = DateTime.UtcNow;
        document.Status = ComputeStatus(document.ExpiryDate, DateTime.UtcNow);
        return await _repository.AddAsync(document);
    }

    public async Task<ComplianceDocument> UpdateAsync(ComplianceDocument document)
    {
        var existing = await _repository.GetByIdAsync(document.Id)
            ?? throw new KeyNotFoundException($"Compliance document with ID {document.Id} not found.");

        if (document.ExpiryDate < document.IssueDate)
            throw new InvalidOperationException("Expiry date cannot be earlier than the issue date.");

        existing.DocumentType = document.DocumentType;
        existing.Name = document.Name;
        existing.DocumentNumber = document.DocumentNumber;
        existing.IssueDate = document.IssueDate;
        existing.ExpiryDate = document.ExpiryDate;
        existing.Notes = document.Notes;

        // File metadata is updated separately via upload; preserve it unless explicitly set.
        if (document.FileName != null) existing.FileName = document.FileName;
        if (document.FilePath != null) existing.FilePath = document.FilePath;
        if (document.ContentType != null) existing.ContentType = document.ContentType;

        existing.Status = ComputeStatus(existing.ExpiryDate, DateTime.UtcNow);
        existing.UpdatedAt = DateTime.UtcNow;

        return await _repository.UpdateAsync(existing);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        return await _repository.DeleteAsync(id);
    }

    public string ComputeStatus(DateTime expiryDate, DateTime referenceDate, int expiringWithinDays = 30)
    {
        if (expiryDate.Date < referenceDate.Date)
            return "Expired";

        if ((expiryDate.Date - referenceDate.Date).TotalDays <= expiringWithinDays)
            return "Expiring";

        return "Valid";
    }
}
