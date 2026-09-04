namespace Fleet.Core.Domain;

public class Tenant : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string ContactEmail { get; set; } = string.Empty;
    public string ContactPhone { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<Fleet> Fleets { get; set; } = new List<Fleet>();
}
