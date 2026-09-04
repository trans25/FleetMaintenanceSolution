using Fleet.Core.Domain;

namespace Fleet.Core.Services;

public interface IManufacturerService
{
    Task<IEnumerable<Manufacturer>> GetAllManufacturersAsync();
    Task<Manufacturer?> GetManufacturerByIdAsync(int id);
    Task<Manufacturer?> GetManufacturerByNameAsync(string name);
    Task<Manufacturer> CreateManufacturerAsync(Manufacturer manufacturer);
    Task<Manufacturer> UpdateManufacturerAsync(Manufacturer manufacturer);
    Task<bool> DeleteManufacturerAsync(int id);
}
