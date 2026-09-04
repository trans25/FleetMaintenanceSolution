namespace Fleet.Core.ViewModels.Fleets;

public class FleetListViewModel
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public int VehicleCount { get; set; }
}
