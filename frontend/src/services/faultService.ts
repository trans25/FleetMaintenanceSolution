import { WORKSHOP_BASE, api, unwrapPaged } from '../api/client';
import type { Fault, PagedResult } from '../api/types';

// List endpoint returns a PagedResult<T>; request a large page and unwrap.
const LIST_PARAMS = { params: { page: 1, pageSize: 1000 } };

export interface FaultQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  severity?: string;
}

export async function getFaults(): Promise<Fault[]> {
  const res = await api.get(`${WORKSHOP_BASE}/faults`, LIST_PARAMS);
  return unwrapPaged<Fault>(res.data);
}

// Server-side paged/filtered query for large workshops. The backend applies
// search (title/description/registration), status, and severity before paging.
export async function queryFaults(params: FaultQueryParams): Promise<PagedResult<Fault>> {
  const res = await api.get<PagedResult<Fault>>(`${WORKSHOP_BASE}/faults`, {
    params: {
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
      search: params.search || undefined,
      status: params.status || undefined,
      severity: params.severity || undefined
    }
  });
  return res.data;
}

export async function reportFault(payload: Partial<Fault>): Promise<Fault> {
  const res = await api.post<Fault>(`${WORKSHOP_BASE}/faults`, payload);
  return res.data;
}

export async function updateFault(id: number, payload: Partial<Fault>): Promise<Fault> {
  const res = await api.put<Fault>(`${WORKSHOP_BASE}/faults/${id}`, payload);
  return res.data;
}

export async function deleteFault(id: number): Promise<void> {
  await api.delete(`${WORKSHOP_BASE}/faults/${id}`);
}

export async function convertFaultToJobCard(
  id: number,
  payload: { assignedToUserId?: number | null; estimatedCost: number }
): Promise<{ jobCardId: number; jobNumber: string }> {
  const res = await api.post(`${WORKSHOP_BASE}/faults/${id}/convert-to-jobcard`, payload);
  return res.data;
}
