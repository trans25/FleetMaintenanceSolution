namespace Fleet.Core.ViewModels.Fleets;

public class FleetDetailViewModel
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public int TenantId { get; set; }
    public string? TenantName { get; set; }
    public int VehicleCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
