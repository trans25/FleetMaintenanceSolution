namespace Fleet.Core.Domain;

public class Fleet : BaseTenantEntity
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public Tenant Tenant { get; set; } = null!;
    public ICollection<Vehicle> Vehicles { get; set; } = new List<Vehicle>();
}
