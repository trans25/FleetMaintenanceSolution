namespace Fleet.Core.ViewModels.Dashboard;

/// <summary>Tenant-scoped operational counts for Tenant Admin / Fleet Manager dashboards.</summary>
public class TenantDashboardSummary
{
    public int Fleets { get; set; }
    public int Vehicles { get; set; }
    public int OpenFaults { get; set; }
    public int ActiveJobCards { get; set; }
    public int ComplianceAlerts { get; set; }
    public int Users { get; set; }
}

/// <summary>Platform-wide counts for System Admin dashboards.</summary>
public class PlatformDashboardSummary
{
    public int Tenants { get; set; }
    public int ActiveTenants { get; set; }
    public int SuspendedTenants { get; set; }
    public int Fleets { get; set; }
    public int Vehicles { get; set; }
}

/// <summary>Personal work counts for Technician dashboards.</summary>
public class TechnicianDashboardSummary
{
    public int AssignedJobCards { get; set; }
    public int OpenFaults { get; set; }
}
