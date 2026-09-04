namespace Fleet.Core.ViewModels.JobCards;

/// <summary>
/// Request body for starting a job card (moving it to InProgress).
/// </summary>
public class StartJobCardViewModel
{
    public int? AssignedToUserId { get; set; }
}
