import { AUTH_BASE, FLEET_BASE, api, unwrapPaged } from '../api/client';
import type { AdminTenant, AdminUser, Fleet } from '../api/types';

// SystemAdmin-only data access for the administration console.
// Backend endpoints:
//   GET /auth/api/tenant                 -> all tenants (RequireSystemAdmin)
//   GET /auth/api/user/tenant/{tenantId} -> users for a tenant
//   GET /fleet/api/fleet/tenant/{tenantId} -> fleets for a tenant

const FLEET_LIST_PARAMS = { params: { page: 1, pageSize: 1000 } };

export async function getTenants(): Promise<AdminTenant[]> {
  const res = await api.get<AdminTenant[]>(`${AUTH_BASE}/tenant`);
  return res.data ?? [];
}

export async function getUsersByTenant(tenantId: number): Promise<AdminUser[]> {
  const res = await api.get<AdminUser[]>(`${AUTH_BASE}/user/tenant/${tenantId}`);
  return res.data ?? [];
}

export async function getFleetsByTenant(tenantId: number): Promise<Fleet[]> {
  const res = await api.get(`${FLEET_BASE}/fleet/tenant/${tenantId}`, FLEET_LIST_PARAMS);
  return unwrapPaged<Fleet>(res.data);
}
