using System.ComponentModel.DataAnnotations;

namespace Fleet.Core.ViewModels.Vehicles;

public class CreateVehicleViewModel
{
    [Required]
    public int FleetId { get; set; }

    [Required]
    public int ManufacturerId { get; set; }

    [Required]
    [StringLength(50)]
    public string RegistrationNumber { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string VIN { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string Model { get; set; } = string.Empty;

    [Range(1900, 2100)]
    public int Year { get; set; }

    [StringLength(50)]
    public string Color { get; set; } = string.Empty;

    [Range(0, double.MaxValue)]
    public decimal Mileage { get; set; }

    [StringLength(50)]
    public string Status { get; set; } = "Active";

    public DateTime PurchaseDate { get; set; }

    public DateTime? LastServiceDate { get; set; }
}
