import { WORKSHOP_BASE, api } from '../api/client';
import type { FleetCostReport, VehicleCostReport } from '../api/types';

export async function getVehicleCostReport(vehicleId: number): Promise<VehicleCostReport> {
  const res = await api.get<VehicleCostReport>(`${WORKSHOP_BASE}/reports/vehicle/${vehicleId}/costs`);
  return res.data;
}

export async function getFleetCostReport(fleetId: number): Promise<FleetCostReport> {
  const res = await api.get<FleetCostReport>(`${WORKSHOP_BASE}/reports/fleet/${fleetId}/costs`);
  return res.data;
}
