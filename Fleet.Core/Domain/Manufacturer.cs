namespace Fleet.Core.Domain;

public class Manufacturer : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string Website { get; set; } = string.Empty;

    // Navigation properties
    public ICollection<Vehicle> Vehicles { get; set; } = new List<Vehicle>();
}
