import { FLEET_BASE, api, unwrapPaged } from '../api/client';
import type { Vehicle } from '../api/types';

// List endpoints return a PagedResult<T>; request a large page and unwrap.
const LIST_PARAMS = { params: { page: 1, pageSize: 1000 } };

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface VehicleQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

export async function getVehicles(): Promise<Vehicle[]> {
  const res = await api.get(`${FLEET_BASE}/vehicle`, LIST_PARAMS);
  return unwrapPaged<Vehicle>(res.data);
}


// search (registration/model/VIN) and status filtering before paging.
export async function queryVehicles(params: VehicleQueryParams): Promise<PagedResult<Vehicle>> {
  const res = await api.get<PagedResult<Vehicle>>(`${FLEET_BASE}/vehicle`, {
    params: {
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
      search: params.search || undefined,
      status: params.status || undefined
    }
  });
  return res.data;
}

export async function getVehicle(id: number): Promise<Vehicle> {
  const res = await api.get<Vehicle>(`${FLEET_BASE}/vehicle/${id}`);
  return res.data;
}

export async function createVehicle(payload: Partial<Vehicle>): Promise<Vehicle> {
  const res = await api.post<Vehicle>(`${FLEET_BASE}/vehicle`, payload);
  return res.data;
}

export async function updateVehicle(id: number, payload: Partial<Vehicle>): Promise<Vehicle> {
  const res = await api.put<Vehicle>(`${FLEET_BASE}/vehicle/${id}`, payload);
  return res.data;
}

export async function deleteVehicle(id: number): Promise<void> {
  await api.delete(`${FLEET_BASE}/vehicle/${id}`);
}
