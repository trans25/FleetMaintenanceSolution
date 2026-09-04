import { FLEET_BASE, api, unwrapPaged } from '../api/client';
import type { Fleet } from '../api/types';

// List endpoints return a PagedResult<T>; request a large page and unwrap.
const LIST_PARAMS = { params: { page: 1, pageSize: 1000 } };

export async function getFleets(): Promise<Fleet[]> {
  const res = await api.get(`${FLEET_BASE}/fleet`, LIST_PARAMS);
  return unwrapPaged<Fleet>(res.data);
}

export async function getFleet(id: number): Promise<Fleet> {
  const res = await api.get<Fleet>(`${FLEET_BASE}/fleet/${id}`);
  return res.data;
}

export async function createFleet(payload: Partial<Fleet>): Promise<Fleet> {
  const res = await api.post<Fleet>(`${FLEET_BASE}/fleet`, payload);
  return res.data;
}

export async function updateFleet(id: number, payload: Partial<Fleet>): Promise<Fleet> {
  const res = await api.put<Fleet>(`${FLEET_BASE}/fleet/${id}`, payload);
  return res.data;
}

export async function deleteFleet(id: number): Promise<void> {
  await api.delete(`${FLEET_BASE}/fleet/${id}`);
}
