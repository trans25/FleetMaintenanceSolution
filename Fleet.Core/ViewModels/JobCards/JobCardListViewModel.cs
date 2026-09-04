namespace Fleet.Core.ViewModels.JobCards;

public class JobCardListViewModel
{
    public int Id { get; set; }
    public string JobNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int VehicleId { get; set; }
    public string? VehicleRegistration { get; set; }
    public string? AssignedToName { get; set; }
    public DateTime CreatedDate { get; set; }
}
