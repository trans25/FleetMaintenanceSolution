using Fleet.Core.Domain;

namespace Fleet.Core.Interfaces;

public interface IServiceScheduleRepository : IRepository<ServiceSchedule>
{
    Task<IEnumerable<ServiceSchedule>> GetSchedulesByVehicleIdAsync(int vehicleId);
    Task<IEnumerable<ServiceSchedule>> GetSchedulesByStatusAsync(string status);
    Task<IEnumerable<ServiceSchedule>> GetUpcomingServicesAsync(DateTime date);
}
