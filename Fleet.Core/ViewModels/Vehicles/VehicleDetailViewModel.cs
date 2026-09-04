namespace Fleet.Core.ViewModels.Vehicles;

public class VehicleDetailViewModel
{
    public int Id { get; set; }
    public int FleetId { get; set; }
    public string? FleetName { get; set; }
    public int ManufacturerId { get; set; }
    public string? ManufacturerName { get; set; }
    public string RegistrationNumber { get; set; } = string.Empty;
    public string VIN { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public int Year { get; set; }
    public string Color { get; set; } = string.Empty;
    public decimal Mileage { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime PurchaseDate { get; set; }
    public DateTime? LastServiceDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
