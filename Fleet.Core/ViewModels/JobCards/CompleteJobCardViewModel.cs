using System.ComponentModel.DataAnnotations;

namespace Fleet.Core.ViewModels.JobCards;

/// <summary>
/// Request body for completing a job card. Allows the final actual cost to be
/// captured as the work order is closed.
/// </summary>
public class CompleteJobCardViewModel
{
    [Range(0, double.MaxValue)]
    public decimal? ActualCost { get; set; }
}
