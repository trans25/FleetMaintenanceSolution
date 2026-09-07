import { FLEET_BASE, api, unwrapPaged } from '../api/client';
import type { Manufacturer } from '../api/types';

export interface ManufacturerPayload {
  name: string;
  country?: string | null;
  website?: string | null;
}

// Manufacturer list returns a plain array; unwrapPaged tolerates both shapes.
export async function getManufacturers(): Promise<Manufacturer[]> {
  const res = await api.get(`${FLEET_BASE}/manufacturer`);
  return unwrapPaged<Manufacturer>(res.data);
}

export async function createManufacturer(payload: ManufacturerPayload): Promise<Manufacturer> {
  const res = await api.post<Manufacturer>(`${FLEET_BASE}/manufacturer`, payload);
  return res.data;
}

export async function updateManufacturer(
  id: number,
  payload: ManufacturerPayload
): Promise<Manufacturer> {
  const res = await api.put<Manufacturer>(`${FLEET_BASE}/manufacturer/${id}`, { ...payload, id });
  return res.data;
}

export async function deleteManufacturer(id: number): Promise<void> {
  await api.delete(`${FLEET_BASE}/manufacturer/${id}`);
}
