using Fleet.Core.Services;
using Fleet.Core.ViewModels.Reports;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Workshop.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IMaintenanceReportService _reportService;

    public ReportsController(IMaintenanceReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpGet("vehicle/{vehicleId}/costs")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<VehicleCostReportViewModel>> GetVehicleCostReport(int vehicleId)
    {
        var report = await _reportService.GetVehicleCostReportAsync(vehicleId);
        return report == null
            ? NotFound($"Vehicle with ID {vehicleId} not found")
            : Ok(report);
    }

    [HttpGet("fleet/{fleetId}/costs")]
    [Authorize(Policy = "CanView")]
    public async Task<ActionResult<FleetCostReportViewModel>> GetFleetCostReport(int fleetId)
    {
        var report = await _reportService.GetFleetCostReportAsync(fleetId);
        return Ok(report);
    }
}
