import { WORKSHOP_BASE, api } from '../api/client';
import type { JobCardTask } from '../api/types';

export async function getTasksByJobCard(jobCardId: number): Promise<JobCardTask[]> {
  const res = await api.get<JobCardTask[]>(`${WORKSHOP_BASE}/jobcardtasks/jobcard/${jobCardId}`);
  return res.data ?? [];
}

export async function createJobCardTask(payload: Partial<JobCardTask>): Promise<JobCardTask> {
  const res = await api.post<JobCardTask>(`${WORKSHOP_BASE}/jobcardtasks`, payload);
  return res.data;
}

export async function updateJobCardTask(
  id: number,
  payload: Partial<JobCardTask>
): Promise<JobCardTask> {
  const res = await api.put<JobCardTask>(`${WORKSHOP_BASE}/jobcardtasks/${id}`, { ...payload, id });
  return res.data;
}

export async function deleteJobCardTask(id: number): Promise<void> {
  await api.delete(`${WORKSHOP_BASE}/jobcardtasks/${id}`);
}
