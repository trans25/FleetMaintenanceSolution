using System.ComponentModel.DataAnnotations;

namespace Fleet.Core.ViewModels.Tenants;

public class UpdateTenantViewModel
{
    [Required]
    public int Id { get; set; }

    [Required]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(200)]
    public string ContactEmail { get; set; } = string.Empty;

    [StringLength(50)]
    public string ContactPhone { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;
}
