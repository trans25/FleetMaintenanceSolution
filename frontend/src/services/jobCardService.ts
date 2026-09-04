import { WORKSHOP_BASE, api } from '../api/client';
import type { JobCard } from '../api/types';

export async function getJobCards(): Promise<JobCard[]> {
  const res = await api.get<JobCard[]>(`${WORKSHOP_BASE}/jobcards`);
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
