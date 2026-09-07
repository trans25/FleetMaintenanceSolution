import { FLEET_BASE, api } from '../api/client';

// Role-specific dashboard summary endpoints (Fleet.API/DashboardController).
//   GET /fleet/api/dashboard/summary   -> tenant-scoped counts (TenantAdmin / FleetManager)
//   GET /fleet/api/dashboard/platform  -> platform-wide counts (SystemAdmin)
//   GET /fleet/api/dashboard/my-work   -> technician personal counts

export interface TenantDashboardSummary {
  fleets: number;
  vehicles: number;
  openFaults: number;
  activeJobCards: number;
  complianceAlerts: number;
  users: number;
}

export interface PlatformDashboardSummary {
  tenants: number;
  activeTenants: number;
  suspendedTenants: number;
  fleets: number;
  vehicles: number;
}

export interface TechnicianDashboardSummary {
  assignedJobCards: number;
  openFaults: number;
}

export async function getTenantSummary(): Promise<TenantDashboardSummary> {
  const res = await api.get<TenantDashboardSummary>(`${FLEET_BASE}/dashboard/summary`);
  return res.data;
}

export async function getPlatformSummary(): Promise<PlatformDashboardSummary> {
  const res = await api.get<PlatformDashboardSummary>(`${FLEET_BASE}/dashboard/platform`);
  return res.data;
}

export async function getMyWorkSummary(): Promise<TechnicianDashboardSummary> {
  const res = await api.get<TechnicianDashboardSummary>(`${FLEET_BASE}/dashboard/my-work`);
  return res.data;
}
