// Shared API types (mirrors backend view models; optional fields keep the UI defensive).

// Wrapper returned by Fleet.API list endpoints (Fleet.Core.Common.PagedResult<T>).
export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

// Result of a CSV bulk import (mirrors Fleet.Core.ViewModels.Import.ImportResult).
export interface ImportRowResult {
  rowNumber: number;
  success: boolean;
  identifier?: string;
  error?: string;
}

export interface ImportResult {
  totalRows: number;
  imported: number;
  failed: number;
  rows: ImportRowResult[];
}

export interface Manufacturer {
  id: number;
  name: string;
  country?: string;
  website?: string;
}

// SystemAdmin administration console
export interface AdminTenant {
  id: number;
  name: string;
  contactEmail?: string;
  isActive: boolean;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  isActive: boolean;
  roles: string[];
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  username: string;
  email: string;
  roles: string[];
}

export interface TenantOnboardingRequest {
  companyName: string;
  contactPhone?: string;
  firstName: string;
  lastName: string;
  username: string;
  workEmail: string;
  password: string;
  confirmPassword: string;
}

export interface TenantOnboardingResult {
  tenantId: number;
  userId: number;
  email: string;
  verificationEmailSent: boolean;
  message: string;
}

export interface Fleet {
  id: number;
  name: string;
  description?: string;
  location?: string;
  isActive: boolean;
  tenantId?: number;
  vehicleCount?: number;
}

export interface Vehicle {
  id: number;
  fleetId: number;
  manufacturerId?: number;
  registrationNumber: string;
  vin: string;
  model: string;
  year?: number;
  color?: string;
  mileage?: number;
  status: string;
  purchaseDate?: string;
  lastServiceDate?: string | null;
}

export interface Fault {
  id: number;
  vehicleId: number;
  vehicleRegistration?: string;
  title: string;
  description?: string;
  severity: string;
  status: string;
  reportedDate?: string;
  resolvedDate?: string | null;
}

export interface JobCard {
  id: number;
  vehicleId: number;
  faultId?: number | null;
  jobNumber: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  assignedToUserId?: number | null;
  createdDate?: string;
  startDate?: string | null;
  completedDate?: string | null;
  estimatedCost?: number;
  actualCost?: number | null;
}

export interface VehicleCostReport {
  vehicleId: number;
  registrationNumber: string;
  vin: string;
  fleetId: number;
  totalJobCards: number;
  completedJobCards: number;
  openJobCards: number;
  totalEstimatedCost: number;
  totalActualCost: number;
}

export interface FleetCostReport {
  fleetId: number;
  vehicleCount: number;
  totalJobCards: number;
  completedJobCards: number;
  openJobCards: number;
  totalEstimatedCost: number;
  totalActualCost: number;
  vehicles: VehicleCostReport[];
}

export interface ServiceSchedule {
  id: number;
  vehicleId: number;
  vehicleRegistration?: string;
  serviceType: string;
  description?: string;
  scheduledDate: string;
  completedDate?: string | null;
  mileageAtService?: number | null;
  status: string;
  notes?: string;
}

export interface ComplianceDocument {
  id: number;
  tenantId?: number;
  vehicleId: number;
  vehicleRegistration?: string;
  documentType: string;
  name: string;
  documentNumber?: string | null;
  issueDate: string;
  expiryDate: string;
  status: string;
  notes?: string | null;
  fileName?: string | null;
  contentType?: string | null;
  hasFile: boolean;
  daysUntilExpiry: number;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface JobCardTask {
  id: number;
  jobCardId: number;
  taskName: string;
  description?: string;
  isCompleted: boolean;
  completedDate?: string | null;
  completedByUserId?: number | null;
  notes?: string;
}

export interface NotificationItem {
  id: number;
  tenantId: number;
  type: string;
  entityType: string;
  entityId: number;
  channel: string;
  recipient: string;
  subject: string;
  body: string;
  status: string;
  error?: string | null;
  sentAt: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
}

// User management (SystemAdmin console)
export interface UserDetail {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  tenantId: number;
  roles: string[];
}

export interface CreateUserPayload {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  tenantId: number;
  roleIds: number[];
}

export interface UpdateUserPayload {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roleIds: number[];
}
