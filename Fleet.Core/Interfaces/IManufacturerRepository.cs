using Fleet.Core.Domain;

namespace Fleet.Core.Interfaces;

public interface IManufacturerRepository : IRepository<Manufacturer>
{
    Task<Manufacturer?> GetByNameAsync(string name);
}
