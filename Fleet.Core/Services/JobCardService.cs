using Fleet.Core.Common;
using Fleet.Core.Domain;
using Fleet.Core.Interfaces;

namespace Fleet.Core.Services;

public class JobCardService : IJobCardService
{
    private readonly IJobCardRepository _jobCardRepository;
    private readonly IJobCardTaskRepository _jobCardTaskRepository;
    private readonly IVehicleRepository _vehicleRepository;
    private readonly IFaultRepository _faultRepository;
    private readonly IServiceScheduleRepository _scheduleRepository;

    public JobCardService(
        IJobCardRepository jobCardRepository,
        IJobCardTaskRepository jobCardTaskRepository,
        IVehicleRepository vehicleRepository,
        IFaultRepository faultRepository,
        IServiceScheduleRepository scheduleRepository)
    {
        _jobCardRepository = jobCardRepository;
        _jobCardTaskRepository = jobCardTaskRepository;
        _vehicleRepository = vehicleRepository;
        _faultRepository = faultRepository;
        _scheduleRepository = scheduleRepository;
    }

    public async Task<IEnumerable<JobCard>> GetAllJobCardsAsync()
    {
        return await _jobCardRepository.GetAllAsync();
    }

    public async Task<JobCard?> GetJobCardByIdAsync(int id)
    {
        return await _jobCardRepository.GetByIdAsync(id);
    }

    public async Task<JobCard?> GetJobCardByJobNumberAsync(string jobNumber)
    {
        return await _jobCardRepository.GetByJobNumberAsync(jobNumber);
    }

    public async Task<IEnumerable<JobCard>> GetJobCardsByVehicleIdAsync(int vehicleId)
    {
        return await _jobCardRepository.GetJobCardsByVehicleIdAsync(vehicleId);
    }

    public async Task<IEnumerable<JobCard>> GetJobCardsByAssignedUserAsync(int userId)
    {
        return await _jobCardRepository.GetJobCardsByAssignedUserAsync(userId);
    }

    public async Task<IEnumerable<JobCard>> GetJobCardsByStatusAsync(string status)
    {
        return await _jobCardRepository.GetJobCardsByStatusAsync(status);
    }

    public async Task<IEnumerable<JobCard>> GetOpenJobCardsAsync()
    {
        var allJobCards = await _jobCardRepository.GetAllAsync();
        return allJobCards.Where(jc => 
            jc.Status != "Completed" && 
            jc.Status != "Cancelled" &&
            jc.CompletedDate == null
        ).ToList();
    }

    public async Task<JobCard> CreateJobCardAsync(JobCard jobCard)
    {
        jobCard.CreatedAt = DateTime.UtcNow;
        jobCard.CreatedDate = DateTime.UtcNow;
        jobCard.Status = MaintenanceStatuses.JobCard.Open;

        // Generate job number if not provided
        if (string.IsNullOrEmpty(jobCard.JobNumber))
        {
            jobCard.JobNumber = $"JOB-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}";
        }

        var created = await _jobCardRepository.AddAsync(jobCard);

        // Opening a job card takes the vehicle into the workshop.
        await SetVehicleStatusAsync(created.VehicleId, MaintenanceStatuses.Vehicle.InService);

        // If raised from a fault, move the fault into progress.
        if (created.FaultId.HasValue)
        {
            var fault = await _faultRepository.GetByIdAsync(created.FaultId.Value);
            if (fault != null && string.Equals(fault.Status, MaintenanceStatuses.Fault.Reported, StringComparison.OrdinalIgnoreCase))
            {
                fault.Status = MaintenanceStatuses.Fault.InProgress;
                fault.UpdatedAt = DateTime.UtcNow;
                await _faultRepository.UpdateAsync(fault);
            }
        }

        return created;
    }

    public async Task<JobCard> UpdateJobCardAsync(JobCard jobCard)
    {
        var existing = await _jobCardRepository.GetByIdAsync(jobCard.Id)
            ?? throw new KeyNotFoundException($"Job card with ID {jobCard.Id} not found.");

        MaintenanceStatuses.EnsureTransitionAllowed(
            MaintenanceStatuses.JobCard.Transitions, existing.Status, jobCard.Status, "job card");

        jobCard.UpdatedAt = DateTime.UtcNow;

        // If marking as completed, set the completed date
        if (string.Equals(jobCard.Status, MaintenanceStatuses.JobCard.Completed, StringComparison.OrdinalIgnoreCase)
            && jobCard.CompletedDate == null)
        {
            jobCard.CompletedDate = DateTime.UtcNow;
        }

        return await _jobCardRepository.UpdateAsync(jobCard);
    }

    public async Task<bool> DeleteJobCardAsync(int id)
    {
        return await _jobCardRepository.DeleteAsync(id);
    }

    // Workflow (real-life maintenance lifecycle) methods

    public async Task<JobCard> StartJobCardAsync(int id, int? assignedToUserId = null)
    {
        var jobCard = await _jobCardRepository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Job card with ID {id} not found.");

        MaintenanceStatuses.EnsureTransitionAllowed(
            MaintenanceStatuses.JobCard.Transitions, jobCard.Status,
            MaintenanceStatuses.JobCard.InProgress, "job card");

        jobCard.Status = MaintenanceStatuses.JobCard.InProgress;
        jobCard.StartDate ??= DateTime.UtcNow;
        if (assignedToUserId.HasValue)
            jobCard.AssignedToUserId = assignedToUserId;
        jobCard.UpdatedAt = DateTime.UtcNow;

        // Ensure the vehicle reflects that work is underway.
        await SetVehicleStatusAsync(jobCard.VehicleId, MaintenanceStatuses.Vehicle.InService);

        return await _jobCardRepository.UpdateAsync(jobCard);
    }

    public async Task<JobCard> CompleteJobCardAsync(int id, decimal? actualCost = null)
    {
        var jobCard = await _jobCardRepository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Job card with ID {id} not found.");

        MaintenanceStatuses.EnsureTransitionAllowed(
            MaintenanceStatuses.JobCard.Transitions, jobCard.Status,
            MaintenanceStatuses.JobCard.Completed, "job card");

        // A job cannot be closed while it still has outstanding tasks.
        var tasks = await _jobCardTaskRepository.GetTasksByJobCardIdAsync(id);
        if (tasks.Any(t => !t.IsCompleted))
        {
            throw new InvalidOperationException(
                "Job card cannot be completed while it has outstanding tasks.");
        }

        var now = DateTime.UtcNow;
        jobCard.Status = MaintenanceStatuses.JobCard.Completed;
        jobCard.CompletedDate = now;
        jobCard.StartDate ??= now;
        if (actualCost.HasValue)
            jobCard.ActualCost = actualCost;
        jobCard.UpdatedAt = now;

        var updated = await _jobCardRepository.UpdateAsync(jobCard);

        // Resolve the originating fault, if any.
        if (jobCard.FaultId.HasValue)
        {
            var fault = await _faultRepository.GetByIdAsync(jobCard.FaultId.Value);
            if (fault != null && !string.Equals(fault.Status, MaintenanceStatuses.Fault.Closed, StringComparison.OrdinalIgnoreCase)
                && !string.Equals(fault.Status, MaintenanceStatuses.Fault.Resolved, StringComparison.OrdinalIgnoreCase))
            {
                fault.Status = MaintenanceStatuses.Fault.Resolved;
                fault.ResolvedDate = now;
                fault.UpdatedAt = now;
                await _faultRepository.UpdateAsync(fault);
            }
        }

        // Mark any due service schedule for this vehicle as completed and stamp the vehicle.
        var vehicle = await _vehicleRepository.GetByIdAsync(jobCard.VehicleId);
        if (vehicle != null)
        {
            var schedules = await _scheduleRepository.GetSchedulesByVehicleIdAsync(jobCard.VehicleId);
            foreach (var schedule in schedules.Where(s =>
                         string.Equals(s.Status, MaintenanceStatuses.ServiceSchedule.Scheduled, StringComparison.OrdinalIgnoreCase)
                         && s.CompletedDate == null))
            {
                schedule.Status = MaintenanceStatuses.ServiceSchedule.Completed;
                schedule.CompletedDate = now;
                schedule.MileageAtService = vehicle.Mileage;
                schedule.UpdatedAt = now;
                await _scheduleRepository.UpdateAsync(schedule);
            }

            vehicle.LastServiceDate = now;
            // Return the vehicle to service only if it has no other open job cards.
            if (!await HasOtherOpenJobCardsAsync(jobCard.VehicleId, jobCard.Id))
            {
                vehicle.Status = MaintenanceStatuses.Vehicle.Active;
            }
            vehicle.UpdatedAt = now;
            await _vehicleRepository.UpdateAsync(vehicle);
        }

        return updated;
    }

    public async Task<JobCard> CancelJobCardAsync(int id)
    {
        var jobCard = await _jobCardRepository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Job card with ID {id} not found.");

        MaintenanceStatuses.EnsureTransitionAllowed(
            MaintenanceStatuses.JobCard.Transitions, jobCard.Status,
            MaintenanceStatuses.JobCard.Cancelled, "job card");

        jobCard.Status = MaintenanceStatuses.JobCard.Cancelled;
        jobCard.UpdatedAt = DateTime.UtcNow;

        var updated = await _jobCardRepository.UpdateAsync(jobCard);

        // Free the vehicle if nothing else keeps it in the workshop.
        if (!await HasOtherOpenJobCardsAsync(jobCard.VehicleId, jobCard.Id))
        {
            await SetVehicleStatusAsync(jobCard.VehicleId, MaintenanceStatuses.Vehicle.Active);
        }

        return updated;
    }

    public async Task<JobCard> ConvertFaultToJobCardAsync(int faultId, int? assignedToUserId = null, decimal estimatedCost = 0)
    {
        var fault = await _faultRepository.GetByIdAsync(faultId)
            ?? throw new KeyNotFoundException($"Fault with ID {faultId} not found.");

        if (string.Equals(fault.Status, MaintenanceStatuses.Fault.Resolved, StringComparison.OrdinalIgnoreCase)
            || string.Equals(fault.Status, MaintenanceStatuses.Fault.Closed, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                $"Fault {faultId} is already {fault.Status} and cannot be converted to a job card.");
        }

        // Avoid raising a duplicate active job card for the same fault.
        var existingForFault = await _jobCardRepository.GetJobCardsByVehicleIdAsync(fault.VehicleId);
        if (existingForFault.Any(jc =>
                jc.FaultId == faultId &&
                jc.Status != MaintenanceStatuses.JobCard.Completed &&
                jc.Status != MaintenanceStatuses.JobCard.Cancelled))
        {
            throw new InvalidOperationException(
                $"An active job card already exists for fault {faultId}.");
        }

        var jobCard = new JobCard
        {
            TenantId = fault.TenantId,
            VehicleId = fault.VehicleId,
            FaultId = fault.Id,
            Title = fault.Title,
            Description = fault.Description,
            Priority = MapSeverityToPriority(fault.Severity),
            AssignedToUserId = assignedToUserId,
            EstimatedCost = estimatedCost
        };

        // CreateJobCardAsync handles job number generation, vehicle status,
        // and moving the fault into progress.
        return await CreateJobCardAsync(jobCard);
    }

    private static string MapSeverityToPriority(string? severity) => severity?.Trim().ToLowerInvariant() switch
    {
        "critical" => "Urgent",
        "high" => "High",
        "low" => "Low",
        _ => "Medium"
    };

    private async Task<bool> HasOtherOpenJobCardsAsync(int vehicleId, int excludingJobCardId)
    {
        var jobCards = await _jobCardRepository.GetJobCardsByVehicleIdAsync(vehicleId);
        return jobCards.Any(jc =>
            jc.Id != excludingJobCardId &&
            jc.Status != MaintenanceStatuses.JobCard.Completed &&
            jc.Status != MaintenanceStatuses.JobCard.Cancelled);
    }

    private async Task SetVehicleStatusAsync(int vehicleId, string newStatus)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(vehicleId);
        if (vehicle == null)
            return;

        if (string.Equals(vehicle.Status, newStatus, StringComparison.OrdinalIgnoreCase))
            return;

        // Never override a decommissioned vehicle from workflow side-effects.
        if (string.Equals(vehicle.Status, MaintenanceStatuses.Vehicle.OutOfService, StringComparison.OrdinalIgnoreCase))
            return;

        vehicle.Status = newStatus;
        vehicle.UpdatedAt = DateTime.UtcNow;
        await _vehicleRepository.UpdateAsync(vehicle);
    }

    // JobCardTask methods

    public async Task<IEnumerable<JobCardTask>> GetTasksByJobCardIdAsync(int jobCardId)
    {
        return await _jobCardTaskRepository.GetTasksByJobCardIdAsync(jobCardId);
    }

    public async Task<JobCardTask> AddTaskToJobCardAsync(int jobCardId, JobCardTask task)
    {
        task.JobCardId = jobCardId;
        task.CreatedAt = DateTime.UtcNow;
        return await _jobCardTaskRepository.AddAsync(task);
    }

    public async Task<JobCardTask> UpdateTaskAsync(JobCardTask task)
    {
        // If marking as completed, set the completed date
        if (task.IsCompleted && task.CompletedDate == null)
        {
            task.CompletedDate = DateTime.UtcNow;
        }

        return await _jobCardTaskRepository.UpdateAsync(task);
    }
}
