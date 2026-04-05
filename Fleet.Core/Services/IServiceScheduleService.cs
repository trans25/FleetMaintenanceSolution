using Fleet.Core.Domain;

namespace Fleet.Core.Services;

public interface IServiceScheduleService
{
    Task<IEnumerable<ServiceSchedule>> GetAllSchedulesAsync();
    Task<ServiceSchedule?> GetScheduleByIdAsync(int id);
    Task<IEnumerable<ServiceSchedule>> GetSchedulesByVehicleIdAsync(int vehicleId);
    Task<IEnumerable<ServiceSchedule>> GetUpcomingSchedulesAsync(DateTime referenceDate);
    Task<IEnumerable<ServiceSchedule>> GetOverdueSchedulesAsync(DateTime referenceDate);
    Task<ServiceSchedule> CreateScheduleAsync(ServiceSchedule schedule);
    Task<ServiceSchedule> UpdateScheduleAsync(ServiceSchedule schedule);
    Task<bool> DeleteScheduleAsync(int id);
}
