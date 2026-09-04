using System.ComponentModel.DataAnnotations;

namespace Fleet.Core.ViewModels.Fleets;

public class UpdateFleetViewModel
{
    [Required]
    public int Id { get; set; }

    [Required]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;

    [StringLength(1000)]
    public string Description { get; set; } = string.Empty;

    [StringLength(500)]
    public string Location { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;
}
