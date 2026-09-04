using System.ComponentModel.DataAnnotations;

namespace Fleet.Core.ViewModels.Faults;

public class ConvertFaultToJobCardViewModel
{
    public int? AssignedToUserId { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Estimated cost cannot be negative.")]
    public decimal EstimatedCost { get; set; }
}
