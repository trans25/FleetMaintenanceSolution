using Fleet.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Fleet.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ManufacturerController : ControllerBase
{
    private readonly IManufacturerService _manufacturerService;

    public ManufacturerController(IManufacturerService manufacturerService)
    {
        _manufacturerService = manufacturerService;
    }

    [HttpGet]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<IEnumerable<Core.Domain.Manufacturer>>> GetAllManufacturers()
    {
        var manufacturers = await _manufacturerService.GetAllManufacturersAsync();
        return Ok(manufacturers);
    }

    [HttpGet("{id}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<Core.Domain.Manufacturer>> GetManufacturerById(int id)
    {
        var manufacturer = await _manufacturerService.GetManufacturerByIdAsync(id);
        return manufacturer == null ? NotFound($"Manufacturer with ID {id} not found") : Ok(manufacturer);
    }

    [HttpGet("name/{name}")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<Core.Domain.Manufacturer>> GetManufacturerByName(string name)
    {
        var manufacturer = await _manufacturerService.GetManufacturerByNameAsync(name);
        return manufacturer == null ? NotFound($"Manufacturer '{name}' not found") : Ok(manufacturer);
    }

    [HttpPost]
    [Authorize(Policy = "RequireManager")]
    public async Task<ActionResult<Core.Domain.Manufacturer>> CreateManufacturer([FromBody] Core.Domain.Manufacturer manufacturer)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var createdManufacturer = await _manufacturerService.CreateManufacturerAsync(manufacturer);
        return CreatedAtAction(nameof(GetManufacturerById), new { id = createdManufacturer.Id }, createdManufacturer);
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "RequireManager")]
    public async Task<ActionResult<Core.Domain.Manufacturer>> UpdateManufacturer(int id, [FromBody] Core.Domain.Manufacturer manufacturer)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (id != manufacturer.Id)
            return BadRequest("ID mismatch");

        var existingManufacturer = await _manufacturerService.GetManufacturerByIdAsync(id);
        if (existingManufacturer == null)
            return NotFound($"Manufacturer with ID {id} not found");

        var updatedManufacturer = await _manufacturerService.UpdateManufacturerAsync(manufacturer);
        return Ok(updatedManufacturer);
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "CanDelete")]
    public async Task<ActionResult> DeleteManufacturer(int id)
    {
        var result = await _manufacturerService.DeleteManufacturerAsync(id);
        return result ? NoContent() : NotFound($"Manufacturer with ID {id} not found");
    }
}
