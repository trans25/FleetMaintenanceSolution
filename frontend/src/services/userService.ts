import { AUTH_BASE, api } from '../api/client';
import type { CreateUserPayload, UpdateUserPayload, UserDetail } from '../api/types';

export async function getUser(id: number): Promise<UserDetail> {
  const res = await api.get<UserDetail>(`${AUTH_BASE}/user/${id}`);
  return res.data;
}

export async function createUser(payload: CreateUserPayload): Promise<UserDetail> {
  const res = await api.post<UserDetail>(`${AUTH_BASE}/user`, payload);
  return res.data;
}

export async function updateUser(id: number, payload: UpdateUserPayload): Promise<UserDetail> {
  const res = await api.put<UserDetail>(`${AUTH_BASE}/user/${id}`, { ...payload, id });
  return res.data;
}

export async function deleteUser(id: number): Promise<void> {
  await api.delete(`${AUTH_BASE}/user/${id}`);
}
