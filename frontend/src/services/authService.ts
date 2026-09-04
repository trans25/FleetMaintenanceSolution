import axios from 'axios';
import { AUTH_BASE, api, tokenStorage } from '../api/client';
import type { LoginResponse, RegisterRequest } from '../api/types';

export async function login(username: string, password: string): Promise<LoginResponse> {
  const res = await axios.post<LoginResponse>(`${AUTH_BASE}/auth/login`, { username, password });
  return res.data;
}

export async function register(payload: RegisterRequest): Promise<void> {
  await axios.post(`${AUTH_BASE}/auth/register`, payload);
}

export async function logout(): Promise<void> {
  const refreshToken = tokenStorage.getRefresh();
  if (!refreshToken) return;
  await api.post(`${AUTH_BASE}/auth/logout`, { refreshToken });
}

export async function forgotPassword(email: string): Promise<void> {
  await axios.post(`${AUTH_BASE}/auth/forgot-password`, { email });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await axios.post(`${AUTH_BASE}/auth/reset-password`, { token, newPassword });
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.post(`${AUTH_BASE}/auth/change-password`, { currentPassword, newPassword });
}
