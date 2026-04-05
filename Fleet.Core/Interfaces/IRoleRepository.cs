using Fleet.Core.Domain;

namespace Fleet.Core.Interfaces;

public interface IRoleRepository : IRepository<Role>
{
    Task<Role?> GetByNameAsync(string name);
}
