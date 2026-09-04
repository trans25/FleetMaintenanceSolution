using Fleet.Core.Domain;
using Fleet.Core.Interfaces;

namespace Fleet.Core.Services;

public class RoleService : IRoleService
{
    private readonly IRoleRepository _roleRepository;

    public RoleService(IRoleRepository roleRepository)
    {
        _roleRepository = roleRepository;
    }

    public async Task<IEnumerable<Role>> GetAllRolesAsync()
    {
        return await _roleRepository.GetAllAsync();
    }

    public async Task<Role?> GetRoleByIdAsync(int id)
    {
        return await _roleRepository.GetByIdAsync(id);
    }

    public async Task<Role?> GetRoleByNameAsync(string name)
    {
        return await _roleRepository.GetByNameAsync(name);
    }

    public async Task<Role> CreateRoleAsync(Role role)
    {
        role.CreatedAt = DateTime.UtcNow;
        return await _roleRepository.AddAsync(role);
    }

    public async Task<Role> UpdateRoleAsync(Role role)
    {
        role.UpdatedAt = DateTime.UtcNow;
        return await _roleRepository.UpdateAsync(role);
    }

    public async Task<bool> DeleteRoleAsync(int id)
    {
        return await _roleRepository.DeleteAsync(id);
    }
}
