using System.ComponentModel.DataAnnotations;

namespace Fleet.Core.Models.Identity;

public class ForgotPasswordModel
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
}
