using Fleet.Core.Data;
using Fleet.Core.Domain;
using Fleet.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Fleet.Core.Repositories;

public class VehicleRepository : Repository<Vehicle>, IVehicleRepository
{
    public VehicleRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<Vehicle?> GetByRegistrationNumberAsync(string registrationNumber)
    {
        return await _dbSet
            .Include(v => v.Fleet)
            .Include(v => v.Manufacturer)
            .FirstOrDefaultAsync(v => v.RegistrationNumber == registrationNumber);
    }

    public async Task<Vehicle?> GetByVINAsync(string vin)
    {
        return await _dbSet
            .Include(v => v.Fleet)
            .Include(v => v.Manufacturer)
            .FirstOrDefaultAsync(v => v.VIN == vin);
    }

    public async Task<IEnumerable<Vehicle>> GetVehiclesByFleetIdAsync(int fleetId)
    {
        return await _dbSet
            .Include(v => v.Manufacturer)
            .Include(v => v.Fleet)
            .Where(v => v.FleetId == fleetId)
            .ToListAsync();
    }

    public async Task<IEnumerable<Vehicle>> GetVehiclesByStatusAsync(string status)
    {
        return await _dbSet
            .Include(v => v.Fleet)
            .Include(v => v.Manufacturer)
            .Where(v => v.Status == status)
            .ToListAsync();
    }

    public override async Task<IEnumerable<Vehicle>> GetAllAsync()
    {
        return await _dbSet
            .Include(v => v.Fleet)
            .Include(v => v.Manufacturer)
            .Include(v => v.ServiceSchedules)
            .Include(v => v.Faults)
            .ToListAsync();
    }

    public override async Task<Vehicle?> GetByIdAsync(int id)
    {
        return await _dbSet
            .Include(v => v.Fleet)
            .Include(v => v.Manufacturer)
            .Include(v => v.ServiceSchedules)
            .Include(v => v.Faults)
            .Include(v => v.JobCards)
            .FirstOrDefaultAsync(v => v.Id == id);
    }
}
