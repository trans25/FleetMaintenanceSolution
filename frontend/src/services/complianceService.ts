import { FLEET_BASE, api, unwrapPaged } from '../api/client';
import type { ComplianceDocument, PagedResult } from '../api/types';

// List endpoint returns a PagedResult<T>; request a large page and unwrap.
const LIST_PARAMS = { params: { page: 1, pageSize: 1000 } };

export interface ComplianceQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  documentType?: string;
  status?: string;
  expiredOnly?: boolean;
  expiringWithinDays?: number;
}

export interface CreateCompliancePayload {
  vehicleId: number;
  documentType: string;
  name: string;
  documentNumber?: string | null;
  issueDate: string;
  expiryDate: string;
  notes?: string | null;
}

export interface UpdateCompliancePayload {
  id: number;
  documentType: string;
  name: string;
  documentNumber?: string | null;
  issueDate: string;
  expiryDate: string;
  notes?: string | null;
}

export async function getComplianceDocuments(): Promise<ComplianceDocument[]> {
  const res = await api.get(`${FLEET_BASE}/compliance`, LIST_PARAMS);
  return unwrapPaged<ComplianceDocument>(res.data);
}

// Server-side paged/filtered query. The backend applies search
// (name/type/number/registration), document type, status, and expiry before paging.
export async function queryComplianceDocuments(
  params: ComplianceQueryParams
): Promise<PagedResult<ComplianceDocument>> {
  const res = await api.get<PagedResult<ComplianceDocument>>(`${FLEET_BASE}/compliance`, {
    params: {
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
      search: params.search || undefined,
      documentType: params.documentType || undefined,
      status: params.status || undefined,
      expiredOnly: params.expiredOnly || undefined,
      expiringWithinDays: params.expiringWithinDays ?? undefined
    }
  });
  return res.data;
}

export async function getComplianceDocument(id: number): Promise<ComplianceDocument> {
  const res = await api.get<ComplianceDocument>(`${FLEET_BASE}/compliance/${id}`);
  return res.data;
}

export async function getComplianceByVehicle(vehicleId: number): Promise<ComplianceDocument[]> {
  const res = await api.get(`${FLEET_BASE}/compliance/vehicle/${vehicleId}`, LIST_PARAMS);
  return unwrapPaged<ComplianceDocument>(res.data);
}

export async function createComplianceDocument(
  payload: CreateCompliancePayload
): Promise<ComplianceDocument> {
  const res = await api.post<ComplianceDocument>(`${FLEET_BASE}/compliance`, payload);
  return res.data;
}

export async function updateComplianceDocument(
  payload: UpdateCompliancePayload
): Promise<ComplianceDocument> {
  const res = await api.put<ComplianceDocument>(`${FLEET_BASE}/compliance/${payload.id}`, payload);
  return res.data;
}

export async function deleteComplianceDocument(id: number): Promise<void> {
  await api.delete(`${FLEET_BASE}/compliance/${id}`);
}

export async function uploadComplianceFile(id: number, file: File): Promise<ComplianceDocument> {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post<ComplianceDocument>(`${FLEET_BASE}/compliance/${id}/file`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
}

export async function downloadComplianceFile(id: number): Promise<Blob> {
  const res = await api.get(`${FLEET_BASE}/compliance/${id}/file`, { responseType: 'blob' });
  return res.data as Blob;
}
