import { fleetApi } from './api';

const fleetService = {
  // Fleets
  getAllFleets: () => fleetApi.get('/Fleet'),
  getFleetById: (id) => fleetApi.get(`/Fleet/${id}`),
  getFleetsByTenant: (tenantId) => fleetApi.get(`/Fleet/tenant/${tenantId}`),
  getActiveFleets: () => fleetApi.get('/Fleet/active'),
  createFleet: (fleet) => fleetApi.post('/Fleet', fleet),
  updateFleet: (id, fleet) => fleetApi.put(`/Fleet/${id}`, fleet),
  deleteFleet: (id) => fleetApi.delete(`/Fleet/${id}`),

  // Vehicles
  getAllVehicles: () => fleetApi.get('/Vehicle'),
  getVehicleById: (id) => fleetApi.get(`/Vehicle/${id}`),
  getVehicleByRegistration: (regNo) => fleetApi.get(`/Vehicle/registration/${regNo}`),
  getVehicleByVIN: (vin) => fleetApi.get(`/Vehicle/vin/${vin}`),
  getVehiclesByFleet: (fleetId) => fleetApi.get(`/Vehicle/fleet/${fleetId}`),
  getVehiclesByStatus: (status) => fleetApi.get(`/Vehicle/status/${status}`),
  createVehicle: (vehicle) => fleetApi.post('/Vehicle', vehicle),
  updateVehicle: (id, vehicle) => fleetApi.put(`/Vehicle/${id}`, vehicle),
  deleteVehicle: (id) => fleetApi.delete(`/Vehicle/${id}`),
};

export default fleetService;
