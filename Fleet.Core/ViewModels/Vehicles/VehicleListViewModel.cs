namespace Fleet.Core.ViewModels.Vehicles;

public class VehicleListViewModel
{
    public int Id { get; set; }
    public string RegistrationNumber { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public int Year { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal Mileage { get; set; }
    public string? ManufacturerName { get; set; }
    public string? FleetName { get; set; }
}
