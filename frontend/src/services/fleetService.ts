import { FLEET_BASE, api, unwrapPaged } from '../api/client';
import type { Fleet, ImportResult, PagedResult } from '../api/types';

// List endpoints return a PagedResult<T>; request a large page and unwrap.
const LIST_PARAMS = { params: { page: 1, pageSize: 1000 } };

export interface FleetQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
}

export async function getFleets(): Promise<Fleet[]> {
  const res = await api.get(`${FLEET_BASE}/fleet`, LIST_PARAMS);
  return unwrapPaged<Fleet>(res.data);
}

// Server-side paged/filtered query for large tenants. The backend applies
// search (name/location/description) and active-state filtering before paging.
export async function queryFleets(params: FleetQueryParams): Promise<PagedResult<Fleet>> {
  const res = await api.get<PagedResult<Fleet>>(`${FLEET_BASE}/fleet`, {
    params: {
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
      search: params.search || undefined,
      isActive: params.isActive
    }
  });
  return res.data;
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

// Uploads a CSV of fleets; the backend stamps the caller's TenantId per row.
export async function importFleets(file: File): Promise<ImportResult> {
  const data = new FormData();
  data.append('file', file);
  const res = await api.post<ImportResult>(`${FLEET_BASE}/fleet/import`, data);
  return res.data;
}
