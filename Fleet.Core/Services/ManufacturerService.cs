using Fleet.Core.Domain;
using Fleet.Core.Interfaces;

namespace Fleet.Core.Services;

public class ManufacturerService : IManufacturerService
{
    private readonly IManufacturerRepository _manufacturerRepository;

    public ManufacturerService(IManufacturerRepository manufacturerRepository)
    {
        _manufacturerRepository = manufacturerRepository;
    }

    public async Task<IEnumerable<Manufacturer>> GetAllManufacturersAsync()
    {
        return await _manufacturerRepository.GetAllAsync();
    }

    public async Task<Manufacturer?> GetManufacturerByIdAsync(int id)
    {
        return await _manufacturerRepository.GetByIdAsync(id);
    }

    public async Task<Manufacturer?> GetManufacturerByNameAsync(string name)
    {
        return await _manufacturerRepository.GetByNameAsync(name);
    }

    public async Task<Manufacturer> CreateManufacturerAsync(Manufacturer manufacturer)
    {
        manufacturer.CreatedAt = DateTime.UtcNow;
        return await _manufacturerRepository.AddAsync(manufacturer);
    }

    public async Task<Manufacturer> UpdateManufacturerAsync(Manufacturer manufacturer)
    {
        manufacturer.UpdatedAt = DateTime.UtcNow;
        return await _manufacturerRepository.UpdateAsync(manufacturer);
    }

    public async Task<bool> DeleteManufacturerAsync(int id)
    {
        return await _manufacturerRepository.DeleteAsync(id);
    }
}
