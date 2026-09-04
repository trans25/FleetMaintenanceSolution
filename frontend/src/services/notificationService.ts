import { FLEET_BASE, api } from '../api/client';
import type { NotificationItem } from '../api/types';

export async function getNotifications(): Promise<NotificationItem[]> {
  const res = await api.get<NotificationItem[]>(`${FLEET_BASE}/notifications`);
  return res.data ?? [];
}
