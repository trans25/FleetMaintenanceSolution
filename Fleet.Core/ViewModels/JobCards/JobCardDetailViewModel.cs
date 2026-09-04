using Fleet.Core.ViewModels.JobCardTasks;

namespace Fleet.Core.ViewModels.JobCards;

public class JobCardDetailViewModel
{
    public int Id { get; set; }
    public int VehicleId { get; set; }
    public string? VehicleRegistration { get; set; }
    public int? FaultId { get; set; }
    public string JobNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int? AssignedToUserId { get; set; }
    public string? AssignedToName { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? CompletedDate { get; set; }
    public decimal EstimatedCost { get; set; }
    public decimal? ActualCost { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<JobCardTaskListViewModel> Tasks { get; set; } = new();
}
