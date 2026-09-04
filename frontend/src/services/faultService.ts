import { WORKSHOP_BASE, api } from '../api/client';
import type { Fault } from '../api/types';

export async function getFaults(): Promise<Fault[]> {
  const res = await api.get<Fault[]>(`${WORKSHOP_BASE}/faults`);
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
