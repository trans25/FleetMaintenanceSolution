namespace Maintenance.API.ViewModels;

public class UpdateJobCardViewModel
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string JobNumber { get; set; } = string.Empty;
    public int VehicleId { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = "Open";
    public string Priority { get; set; } = "Medium";
    public int? AssignedToUserId { get; set; }
    public decimal EstimatedCost { get; set; }
    public decimal ActualCost { get; set; }
}
