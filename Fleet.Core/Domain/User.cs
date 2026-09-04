namespace Fleet.Core.Domain;

public class User : BaseTenantEntity
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public Tenant Tenant { get; set; } = null!;
    public ICollection<Role> Roles { get; set; } = new List<Role>();
    public ICollection<JobCard> AssignedJobCards { get; set; } = new List<JobCard>();
}
