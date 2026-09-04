import { FLEET_BASE, api, unwrapPaged } from '../api/client';
import type { Manufacturer } from '../api/types';

// Manufacturer list returns a plain array; unwrapPaged tolerates both shapes.
export async function getManufacturers(): Promise<Manufacturer[]> {
  const res = await api.get(`${FLEET_BASE}/manufacturer`);
  return unwrapPaged<Manufacturer>(res.data);
}
