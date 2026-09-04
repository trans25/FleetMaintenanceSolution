import { AUTH_BASE, api } from '../api/client';
import type { Role } from '../api/types';

export async function getRoles(): Promise<Role[]> {
  const res = await api.get<Role[]>(`${AUTH_BASE}/role`);
  return res.data ?? [];
}
