using Fleet.Core.Domain;

namespace Fleet.Core.Interfaces;

public interface IJobCardRepository : IRepository<JobCard>
{
    Task<JobCard?> GetByJobNumberAsync(string jobNumber);
    Task<IEnumerable<JobCard>> GetJobCardsByVehicleIdAsync(int vehicleId);
    Task<IEnumerable<JobCard>> GetJobCardsByStatusAsync(string status);
    Task<IEnumerable<JobCard>> GetJobCardsByAssignedUserAsync(int userId);
}
