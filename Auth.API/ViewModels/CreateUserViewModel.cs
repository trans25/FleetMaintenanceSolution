using System.ComponentModel.DataAnnotations;

namespace Auth.API.ViewModels;

public class CreateUserViewModel
{
    [Required]
    public int TenantId { get; set; }

    [Required]
    [StringLength(100)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(200)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(100, MinimumLength = 6)]
    public string Password { get; set; } = string.Empty;

    [StringLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [StringLength(100)]
    public string LastName { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public List<int> RoleIds { get; set; } = new();
}
