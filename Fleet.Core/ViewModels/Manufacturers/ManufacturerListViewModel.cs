namespace Fleet.Core.ViewModels.Manufacturers;

public class ManufacturerListViewModel
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public int VehicleCount { get; set; }
}
