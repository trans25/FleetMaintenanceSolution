namespace Fleet.API.ViewModels;

public class CreateFleetViewModel
{
    public int TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}
