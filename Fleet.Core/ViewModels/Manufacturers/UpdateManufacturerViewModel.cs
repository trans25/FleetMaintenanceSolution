using System.ComponentModel.DataAnnotations;

namespace Fleet.Core.ViewModels.Manufacturers;

public class UpdateManufacturerViewModel
{
    [Required]
    public int Id { get; set; }

    [Required]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;

    [StringLength(100)]
    public string Country { get; set; } = string.Empty;

    [StringLength(500)]
    public string Website { get; set; } = string.Empty;
}
