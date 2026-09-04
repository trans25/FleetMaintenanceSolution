import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig
} from 'axios';

// Gateway route prefixes (see Fleet.Gateway/appsettings.json). The gateway only
// strips the leading segment, so the downstream `/api/...` path is preserved.
export const AUTH_BASE = '/auth/api';
export const FLEET_BASE = '/fleet/api';
export const WORKSHOP_BASE = '/workshop/api';

const TOKEN_KEY = 'fm.token';
const REFRESH_KEY = 'fm.refreshToken';

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set: (token: string, refreshToken: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }
};

export const api = axios.create({
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.get();
  if (token) {
    const headers = AxiosHeaders.from(config.headers);
    headers.set('Authorization', `Bearer ${token}`);
    config.headers = headers;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefresh();
  if (!refreshToken) return null;
  try {
    const res = await axios.post(`${AUTH_BASE}/auth/refresh`, { refreshToken });
    const { token, refreshToken: newRefresh } = res.data;
    tokenStorage.set(token, newRefresh);
    return token;
  } catch {
    tokenStorage.clear();
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;

    // Don't try to refresh for the auth endpoints themselves.
    const url = original?.url ?? '';
    const isAuthCall = url.includes('/auth/login') || url.includes('/auth/refresh');

    if (status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      refreshing = refreshing ?? refreshAccessToken();
      const newToken = await refreshing;
      refreshing = null;
      if (newToken) {
        original.headers = { ...(original.headers ?? {}), Authorization: `Bearer ${newToken}` };
        return api(original);
      }
      // Refresh failed -> force re-login.
      tokenStorage.clear();
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

// Normalizes a list response that may be either a raw array or a PagedResult<T>.
export function unwrapPaged<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object' && Array.isArray((data as { items?: unknown }).items)) {
    return (data as { items: T[] }).items;
  }
  return [];
}

export function apiErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === 'string' && data.trim()) return data;
    if (data && typeof data === 'object') {
      const anyData = data as Record<string, unknown>;
      if (typeof anyData.title === 'string') return anyData.title;
      if (typeof anyData.message === 'string') return anyData.message;
      if (anyData.errors && typeof anyData.errors === 'object') {
        const first = Object.values(anyData.errors as Record<string, string[]>)[0];
        if (Array.isArray(first) && first.length) return first[0];
      }
    }
    if (error.message) return error.message;
  }
  return fallback;
}
