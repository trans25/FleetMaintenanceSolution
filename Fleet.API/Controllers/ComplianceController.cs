using Fleet.Core.Common;
using Fleet.Core.Domain;
using Fleet.Core.Services;
using Fleet.Core.Storage;
using Fleet.Core.ViewModels.ComplianceDocuments;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Fleet.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ComplianceController : ControllerBase
{
    private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10 MB
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".pdf", ".png", ".jpg", ".jpeg", ".gif", ".tif", ".tiff", ".doc", ".docx"
    };

    private readonly IComplianceDocumentService _service;
    private readonly IVehicleService _vehicleService;
    private readonly IFileStorage _fileStorage;

    public ComplianceController(
        IComplianceDocumentService service,
        IVehicleService vehicleService,
        IFileStorage fileStorage)
    {
        _service = service;
        _vehicleService = vehicleService;
        _fileStorage = fileStorage;
    }

    [HttpGet]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<PagedResult<ComplianceDocumentListViewModel>>> GetAll([FromQuery] ComplianceQuery query)
    {
        var documents = ApplyTenantScope(await _service.GetAllAsync());
        var now = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(query.DocumentType))
        {
            documents = documents.Where(d =>
                string.Equals(d.DocumentType, query.DocumentType, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            documents = documents.Where(d =>
                string.Equals(_service.ComputeStatus(d.ExpiryDate, now), query.Status, StringComparison.OrdinalIgnoreCase));
        }

        if (query.ExpiredOnly == true)
        {
            documents = documents.Where(d => d.ExpiryDate.Date < now.Date);
        }

        if (query.ExpiringWithinDays is int within && within >= 0)
        {
            var limit = now.Date.AddDays(within);
            documents = documents.Where(d => d.ExpiryDate.Date >= now.Date && d.ExpiryDate.Date <= limit);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim();
            documents = documents.Where(d =>
                (d.Name?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false) ||
                (d.DocumentType?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false) ||
                (d.DocumentNumber?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false) ||
                (d.Vehicle?.RegistrationNumber?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false));
        }

        var vms = documents
            .OrderBy(d => d.ExpiryDate)
            .Select(d => MapToListViewModel(d, now));

        return Ok(PagedResult<ComplianceDocumentListViewModel>.Create(vms, query.Page, query.PageSize));
    }

    [HttpGet("{id}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<ComplianceDocumentDetailViewModel>> GetById(int id)
    {
        var document = await _service.GetByIdAsync(id);
        if (document == null)
            return NotFound($"Compliance document with ID {id} not found");
        if (!CanAccessTenant(document.TenantId))
            return Forbid();

        return Ok(MapToDetailViewModel(document));
    }

    [HttpGet("vehicle/{vehicleId}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<PagedResult<ComplianceDocumentListViewModel>>> GetByVehicleId(int vehicleId, [FromQuery] PaginationQuery pagination)
    {
        var documents = ApplyTenantScope(await _service.GetByVehicleIdAsync(vehicleId));
        var now = DateTime.UtcNow;
        var vms = documents
            .OrderBy(d => d.ExpiryDate)
            .Select(d => MapToListViewModel(d, now));
        return Ok(PagedResult<ComplianceDocumentListViewModel>.Create(vms, pagination.Page, pagination.PageSize));
    }

    [HttpPost]
    [Authorize(Policy = "CanAdd")]
    public async Task<ActionResult<ComplianceDocumentDetailViewModel>> Create([FromBody] CreateComplianceDocumentViewModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var vehicle = await _vehicleService.GetVehicleByIdAsync(model.VehicleId);
        if (vehicle == null)
            return NotFound($"Vehicle with ID {model.VehicleId} not found");
        if (!CanAccessTenant(vehicle.TenantId))
            return Forbid();

        var document = new ComplianceDocument
        {
            VehicleId = model.VehicleId,
            TenantId = vehicle.TenantId,
            DocumentType = model.DocumentType,
            Name = model.Name,
            DocumentNumber = model.DocumentNumber,
            IssueDate = model.IssueDate,
            ExpiryDate = model.ExpiryDate,
            Notes = model.Notes
        };

        try
        {
            var created = await _service.CreateAsync(document);
            var reloaded = await _service.GetByIdAsync(created.Id) ?? created;
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, MapToDetailViewModel(reloaded));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "CanEdit")]
    public async Task<ActionResult<ComplianceDocumentDetailViewModel>> Update(int id, [FromBody] UpdateComplianceDocumentViewModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);
        if (id != model.Id)
            return BadRequest("Route id does not match body id.");

        var existing = await _service.GetByIdAsync(id);
        if (existing == null)
            return NotFound($"Compliance document with ID {id} not found");
        if (!CanAccessTenant(existing.TenantId))
            return Forbid();

        existing.DocumentType = model.DocumentType;
        existing.Name = model.Name;
        existing.DocumentNumber = model.DocumentNumber;
        existing.IssueDate = model.IssueDate;
        existing.ExpiryDate = model.ExpiryDate;
        existing.Notes = model.Notes;

        try
        {
            var updated = await _service.UpdateAsync(existing);
            var reloaded = await _service.GetByIdAsync(updated.Id) ?? updated;
            return Ok(MapToDetailViewModel(reloaded));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "CanDelete")]
    public async Task<IActionResult> Delete(int id)
    {
        var existing = await _service.GetByIdAsync(id);
        if (existing == null)
            return NotFound($"Compliance document with ID {id} not found");
        if (!CanAccessTenant(existing.TenantId))
            return Forbid();

        if (!string.IsNullOrEmpty(existing.FilePath))
            await _fileStorage.DeleteAsync(existing.FilePath);

        await _service.DeleteAsync(id);
        return NoContent();
    }

    [HttpPost("{id}/file")]
    [Authorize(Policy = "CanEdit")]
    public async Task<ActionResult<ComplianceDocumentDetailViewModel>> UploadFile(int id, IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file was provided.");
        if (file.Length > MaxFileSizeBytes)
            return BadRequest("File exceeds the maximum allowed size of 10 MB.");

        var extension = Path.GetExtension(file.FileName);
        if (string.IsNullOrEmpty(extension) || !AllowedExtensions.Contains(extension))
            return BadRequest("Unsupported file type.");

        var existing = await _service.GetByIdAsync(id);
        if (existing == null)
            return NotFound($"Compliance document with ID {id} not found");
        if (!CanAccessTenant(existing.TenantId))
            return Forbid();

        // Replace any previously stored file.
        if (!string.IsNullOrEmpty(existing.FilePath))
            await _fileStorage.DeleteAsync(existing.FilePath);

        await using var stream = file.OpenReadStream();
        var storageKey = await _fileStorage.SaveAsync(file.FileName, stream);

        existing.FileName = file.FileName;
        existing.FilePath = storageKey;
        existing.ContentType = file.ContentType;

        var updated = await _service.UpdateAsync(existing);
        var reloaded = await _service.GetByIdAsync(updated.Id) ?? updated;
        return Ok(MapToDetailViewModel(reloaded));
    }

    [HttpGet("{id}/file")]
    [Authorize(Policy = "CanView")]
    public async Task<IActionResult> DownloadFile(int id)
    {
        var existing = await _service.GetByIdAsync(id);
        if (existing == null)
            return NotFound($"Compliance document with ID {id} not found");
        if (!CanAccessTenant(existing.TenantId))
            return Forbid();
        if (string.IsNullOrEmpty(existing.FilePath))
            return NotFound("No file is attached to this document.");

        var stream = await _fileStorage.OpenReadAsync(existing.FilePath);
        if (stream == null)
            return NotFound("The attached file could not be found in storage.");

        var contentType = string.IsNullOrEmpty(existing.ContentType)
            ? "application/octet-stream"
            : existing.ContentType;
        return File(stream, contentType, existing.FileName ?? $"document-{id}");
    }

    // ----- Tenant isolation helpers -----

    private bool CanAccessTenant(int tenantId)
        => User.IsSystemAdmin() || User.GetTenantId() == tenantId;

    private IEnumerable<ComplianceDocument> ApplyTenantScope(IEnumerable<ComplianceDocument> documents)
    {
        if (User.IsSystemAdmin())
            return documents;
        var tenantId = User.GetTenantId();
        return tenantId is null
            ? Enumerable.Empty<ComplianceDocument>()
            : documents.Where(d => d.TenantId == tenantId);
    }

    // ----- Mapping helpers -----

    private ComplianceDocumentListViewModel MapToListViewModel(ComplianceDocument d, DateTime now) => new()
    {
        Id = d.Id,
        TenantId = d.TenantId,
        VehicleId = d.VehicleId,
        VehicleRegistration = d.Vehicle?.RegistrationNumber,
        DocumentType = d.DocumentType,
        Name = d.Name,
        DocumentNumber = d.DocumentNumber,
        IssueDate = d.IssueDate,
        ExpiryDate = d.ExpiryDate,
        Status = _service.ComputeStatus(d.ExpiryDate, now),
        HasFile = !string.IsNullOrEmpty(d.FilePath),
        DaysUntilExpiry = (int)Math.Ceiling((d.ExpiryDate.Date - now.Date).TotalDays)
    };

    private ComplianceDocumentDetailViewModel MapToDetailViewModel(ComplianceDocument d)
    {
        var now = DateTime.UtcNow;
        return new ComplianceDocumentDetailViewModel
        {
            Id = d.Id,
            VehicleId = d.VehicleId,
            VehicleRegistration = d.Vehicle?.RegistrationNumber,
            DocumentType = d.DocumentType,
            Name = d.Name,
            DocumentNumber = d.DocumentNumber,
            IssueDate = d.IssueDate,
            ExpiryDate = d.ExpiryDate,
            Status = _service.ComputeStatus(d.ExpiryDate, now),
            Notes = d.Notes,
            FileName = d.FileName,
            ContentType = d.ContentType,
            HasFile = !string.IsNullOrEmpty(d.FilePath),
            DaysUntilExpiry = (int)Math.Ceiling((d.ExpiryDate.Date - now.Date).TotalDays),
            CreatedAt = d.CreatedAt,
            UpdatedAt = d.UpdatedAt
        };
    }
}
