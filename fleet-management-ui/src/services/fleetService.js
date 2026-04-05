import { fleetApi, vehicleApi, authApi } from './api';

const fleetService = {
  // Tenants
  getAllTenants: () => vehicleApi.get('/Tenant'),
  getTenantById: (id) => vehicleApi.get(`/Tenant/${id}`),
  getActiveTenants: () => vehicleApi.get('/Tenant/active'),
  createTenant: (tenant) => vehicleApi.post('/Tenant', tenant),
  updateTenant: (id, tenant) => vehicleApi.put(`/Tenant/${id}`, tenant),
  deleteTenant: (id) => vehicleApi.delete(`/Tenant/${id}`),

  // Users
  getAllUsers: () => authApi.get('/User'),
  getUserById: (id) => authApi.get(`/User/${id}`),
  getUsersByTenant: (tenantId) => authApi.get(`/User/tenant/${tenantId}`),
  createUser: (user) => authApi.post('/User', user),
  updateUser: (id, user) => authApi.put(`/User/${id}`, user),
  deleteUser: (id) => authApi.delete(`/User/${id}`),

  // Roles
  getAllRoles: () => authApi.get('/Role'),
  getRoleById: (id) => authApi.get(`/Role/${id}`),

  // Fleets
  getAllFleets: () => fleetApi.get('/Fleet'),
  getFleetById: (id) => fleetApi.get(`/Fleet/${id}`),
  getFleetsByTenant: (tenantId) => fleetApi.get(`/Fleet/tenant/${tenantId}`),
  getActiveFleets: () => fleetApi.get('/Fleet/active'),
  createFleet: (fleet) => fleetApi.post('/Fleet', fleet),
  updateFleet: (id, fleet) => fleetApi.put(`/Fleet/${id}`, fleet),
  deleteFleet: (id) => fleetApi.delete(`/Fleet/${id}`),

  // Vehicles - now using Vehicle API (localhost:5000)
  getAllVehicles: () => vehicleApi.get('/Vehicle'),
  getVehicleById: (id) => vehicleApi.get(`/Vehicle/${id}`),
  getVehicleByRegistration: (regNo) => vehicleApi.get(`/Vehicle/registration/${regNo}`),
  getVehicleByVIN: (vin) => vehicleApi.get(`/Vehicle/vin/${vin}`),
  getVehiclesByFleet: (fleetId) => vehicleApi.get(`/Vehicle/fleet/${fleetId}`),
  getVehiclesByStatus: (status) => vehicleApi.get(`/Vehicle/status/${status}`),
  createVehicle: (vehicle) => vehicleApi.post('/Vehicle', vehicle),
  updateVehicle: (id, vehicle) => vehicleApi.put(`/Vehicle/${id}`, vehicle),
  deleteVehicle: (id) => vehicleApi.delete(`/Vehicle/${id}`),
};

export default fleetService;
