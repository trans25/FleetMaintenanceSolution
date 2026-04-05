namespace Vehicle.API.DTOs;

/// <summary>
/// DTO for creating a new vehicle
/// Note: TenantId is NOT included - it's automatically set from JWT claims
/// </summary>
public class CreateVehicleDto
{
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

/// <summary>
/// DTO for updating a vehicle
/// Note: TenantId cannot be changed - it's immutable
/// </summary>
public class UpdateVehicleDto
{
    public int Id { get; set; }
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
    public DateTime? LastServiceDate { get; set; }
}

/// <summary>
/// DTO for vehicle response
/// Includes TenantId for display purposes
/// </summary>
public class VehicleDto
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int FleetId { get; set; }
    public string FleetName { get; set; } = string.Empty;
    public int ManufacturerId { get; set; }
    public string ManufacturerName { get; set; } = string.Empty;
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
