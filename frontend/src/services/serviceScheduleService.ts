import { WORKSHOP_BASE, api } from '../api/client';
import type { ServiceSchedule } from '../api/types';

export async function getServiceSchedules(): Promise<ServiceSchedule[]> {
  const res = await api.get<ServiceSchedule[]>(`${WORKSHOP_BASE}/serviceschedules`);
  return res.data ?? [];
}

export async function getUpcomingSchedules(): Promise<ServiceSchedule[]> {
  const res = await api.get<ServiceSchedule[]>(`${WORKSHOP_BASE}/serviceschedules/upcoming`);
  return res.data ?? [];
}

export async function getOverdueSchedules(): Promise<ServiceSchedule[]> {
  const res = await api.get<ServiceSchedule[]>(`${WORKSHOP_BASE}/serviceschedules/overdue`);
  return res.data ?? [];
}

export async function getSchedulesByVehicle(vehicleId: number): Promise<ServiceSchedule[]> {
  const res = await api.get<ServiceSchedule[]>(
    `${WORKSHOP_BASE}/serviceschedules/vehicle/${vehicleId}`
  );
  return res.data ?? [];
}

export async function createServiceSchedule(
  payload: Partial<ServiceSchedule>
): Promise<ServiceSchedule> {
  const res = await api.post<ServiceSchedule>(`${WORKSHOP_BASE}/serviceschedules`, payload);
  return res.data;
}

export async function updateServiceSchedule(
  id: number,
  payload: Partial<ServiceSchedule>
): Promise<ServiceSchedule> {
  const res = await api.put<ServiceSchedule>(`${WORKSHOP_BASE}/serviceschedules/${id}`, {
    ...payload,
    id
  });
  return res.data;
}

export async function deleteServiceSchedule(id: number): Promise<void> {
  await api.delete(`${WORKSHOP_BASE}/serviceschedules/${id}`);
}
