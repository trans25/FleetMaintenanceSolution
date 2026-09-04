using System.ComponentModel.DataAnnotations;

namespace Fleet.Core.ViewModels.Roles;

public class UpdateRoleViewModel
{
    [Required]
    public int Id { get; set; }

    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [StringLength(500)]
    public string Description { get; set; } = string.Empty;
}
