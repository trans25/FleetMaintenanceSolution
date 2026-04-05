namespace Vehicle.API.ViewModels;

public class CreateVehicleViewModel
{
    public int TenantId { get; set; }
    public int FleetId { get; set; }
    public int ManufacturerId { get; set; }
    public string RegistrationNumber { get; set; } = string.Empty;
    public string VIN { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public int Year { get; set; }
    public string Color { get; set; } = string.Empty;
    public decimal Mileage { get; set; }
    public string Status { get; set; } = "Active";
    public DateTime PurchaseDate { get; set; }
}
