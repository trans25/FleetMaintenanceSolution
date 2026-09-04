namespace Fleet.Core.Domain;

/// <summary>
/// Vehicle entity with multi-tenant support
/// Each vehicle belongs to a specific tenant for data isolation
/// </summary>
public class Vehicle : BaseTenantEntity
{
    public int FleetId { get; set; }
    public int ManufacturerId { get; set; }
    public string RegistrationNumber { get; set; } = string.Empty;
    public string VIN { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public int Year { get; set; }
    public string Color { get; set; } = string.Empty;
    public decimal Mileage { get; set; }
    public string Status { get; set; } = "Active"; // Active, InService, OutOfService
    public DateTime PurchaseDate { get; set; }
    public DateTime? LastServiceDate { get; set; }

    // Navigation properties
    public Fleet Fleet { get; set; } = null!;
    public Manufacturer Manufacturer { get; set; } = null!;
    public ICollection<ServiceSchedule> ServiceSchedules { get; set; } = new List<ServiceSchedule>();
    public ICollection<Fault> Faults { get; set; } = new List<Fault>();
    public ICollection<JobCard> JobCards { get; set; } = new List<JobCard>();
}
