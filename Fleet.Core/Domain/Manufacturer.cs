namespace Fleet.Core.Domain;

public class Manufacturer
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string Website { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<Vehicle> Vehicles { get; set; } = new List<Vehicle>();
}
