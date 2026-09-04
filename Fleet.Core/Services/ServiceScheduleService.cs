using Fleet.Core.Common;
using Fleet.Core.Domain;
using Fleet.Core.Interfaces;

namespace Fleet.Core.Services;

public class ServiceScheduleService : IServiceScheduleService
{
    private readonly IServiceScheduleRepository _scheduleRepository;

    public ServiceScheduleService(IServiceScheduleRepository scheduleRepository)
    {
        _scheduleRepository = scheduleRepository;
    }

    public async Task<IEnumerable<ServiceSchedule>> GetAllSchedulesAsync()
    {
        return await _scheduleRepository.GetAllAsync();
    }

    public async Task<ServiceSchedule?> GetScheduleByIdAsync(int id)
    {
        return await _scheduleRepository.GetByIdAsync(id);
    }

    public async Task<IEnumerable<ServiceSchedule>> GetSchedulesByVehicleIdAsync(int vehicleId)
    {
        return await _scheduleRepository.GetSchedulesByVehicleIdAsync(vehicleId);
    }

    public async Task<IEnumerable<ServiceSchedule>> GetUpcomingSchedulesAsync(DateTime referenceDate)
    {
        return await _scheduleRepository.GetUpcomingServicesAsync(referenceDate);
    }

    public async Task<IEnumerable<ServiceSchedule>> GetOverdueSchedulesAsync(DateTime referenceDate)
    {
        var allSchedules = await _scheduleRepository.GetAllAsync();
        return allSchedules.Where(s => 
            s.ScheduledDate < referenceDate && 
            s.CompletedDate == null &&
            s.Status != "Completed"
        ).ToList();
    }

    public async Task<ServiceSchedule> CreateScheduleAsync(ServiceSchedule schedule)
    {
        schedule.CreatedAt = DateTime.UtcNow;
        schedule.Status = MaintenanceStatuses.ServiceSchedule.Scheduled;
        return await _scheduleRepository.AddAsync(schedule);
    }

    public async Task<ServiceSchedule> UpdateScheduleAsync(ServiceSchedule schedule)
    {
        var existing = await _scheduleRepository.GetByIdAsync(schedule.Id)
            ?? throw new KeyNotFoundException($"Service schedule with ID {schedule.Id} not found.");

        MaintenanceStatuses.EnsureTransitionAllowed(
            MaintenanceStatuses.ServiceSchedule.Transitions, existing.Status, schedule.Status, "service schedule");

        schedule.UpdatedAt = DateTime.UtcNow;

        if (string.Equals(schedule.Status, MaintenanceStatuses.ServiceSchedule.Completed, StringComparison.OrdinalIgnoreCase)
            && schedule.CompletedDate == null)
        {
            schedule.CompletedDate = DateTime.UtcNow;
        }

        return await _scheduleRepository.UpdateAsync(schedule);
    }

    public async Task<bool> DeleteScheduleAsync(int id)
    {
        return await _scheduleRepository.DeleteAsync(id);
    }
}
