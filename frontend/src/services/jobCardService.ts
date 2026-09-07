import { WORKSHOP_BASE, api, unwrapPaged } from '../api/client';
import type { JobCard, PagedResult } from '../api/types';

// List endpoint returns a PagedResult<T>; request a large page and unwrap.
const LIST_PARAMS = { params: { page: 1, pageSize: 1000 } };

export interface JobCardQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  priority?: string;
}

export async function getJobCards(): Promise<JobCard[]> {
  const res = await api.get(`${WORKSHOP_BASE}/jobcards`, LIST_PARAMS);
  return unwrapPaged<JobCard>(res.data);
}

// Server-side paged/filtered query for large workshops. The backend applies
// search (job number/title/description/registration), status, and priority before paging.
export async function queryJobCards(params: JobCardQueryParams): Promise<PagedResult<JobCard>> {
  const res = await api.get<PagedResult<JobCard>>(`${WORKSHOP_BASE}/jobcards`, {
    params: {
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
      search: params.search || undefined,
      status: params.status || undefined,
      priority: params.priority || undefined
    }
  });
  return res.data;
}

export async function getJobCard(id: number): Promise<JobCard> {
  const res = await api.get<JobCard>(`${WORKSHOP_BASE}/jobcards/${id}`);
  return res.data;
}

export async function createJobCard(payload: Partial<JobCard>): Promise<JobCard> {
  const res = await api.post<JobCard>(`${WORKSHOP_BASE}/jobcards`, payload);
  return res.data;
}

export async function updateJobCard(id: number, payload: Partial<JobCard>): Promise<JobCard> {
  const res = await api.put<JobCard>(`${WORKSHOP_BASE}/jobcards/${id}`, { ...payload, id });
  return res.data;
}

export async function startJobCard(id: number, assignedToUserId?: number | null): Promise<JobCard> {
  const res = await api.post<JobCard>(`${WORKSHOP_BASE}/jobcards/${id}/start`, { assignedToUserId });
  return res.data;
}

export async function completeJobCard(id: number, actualCost?: number | null): Promise<JobCard> {
  const res = await api.post<JobCard>(`${WORKSHOP_BASE}/jobcards/${id}/complete`, { actualCost });
  return res.data;
}

export async function cancelJobCard(id: number): Promise<JobCard> {
  const res = await api.post<JobCard>(`${WORKSHOP_BASE}/jobcards/${id}/cancel`, {});
  return res.data;
}
