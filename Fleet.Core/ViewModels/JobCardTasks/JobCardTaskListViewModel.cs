namespace Fleet.Core.ViewModels.JobCardTasks;

public class JobCardTaskListViewModel
{
    public int Id { get; set; }
    public int JobCardId { get; set; }
    public string TaskName { get; set; } = string.Empty;
    public bool IsCompleted { get; set; }
    public DateTime? CompletedDate { get; set; }
}
