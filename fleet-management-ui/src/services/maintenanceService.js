import { maintenanceApi } from './api';

const maintenanceService = {
  // Faults
  getAllFaults: () => maintenanceApi.get('/Fault'),
  getFaultById: (id) => maintenanceApi.get(`/Fault/${id}`),
  getFaultsByVehicle: (vehicleId) => maintenanceApi.get(`/Fault/vehicle/${vehicleId}`),
  getFaultsByStatus: (status) => maintenanceApi.get(`/Fault/status/${status}`),
  getFaultsBySeverity: (severity) => maintenanceApi.get(`/Fault/severity/${severity}`),
  getOpenFaults: () => maintenanceApi.get('/Fault/open'),
  createFault: (fault) => maintenanceApi.post('/Fault', fault),
  updateFault: (id, fault) => maintenanceApi.put(`/Fault/${id}`, fault),
  deleteFault: (id) => maintenanceApi.delete(`/Fault/${id}`),

  // Job Cards
  getAllJobCards: () => maintenanceApi.get('/JobCard'),
  getJobCardById: (id) => maintenanceApi.get(`/JobCard/${id}`),
  getJobCardByJobNumber: (jobNumber) => maintenanceApi.get(`/JobCard/job/${jobNumber}`),
  getJobCardsByVehicle: (vehicleId) => maintenanceApi.get(`/JobCard/vehicle/${vehicleId}`),
  getJobCardsByAssignedUser: (userId) => maintenanceApi.get(`/JobCard/assigned/${userId}`),
  getJobCardsByStatus: (status) => maintenanceApi.get(`/JobCard/status/${status}`),
  getOpenJobCards: () => maintenanceApi.get('/JobCard/open'),
  createJobCard: (jobCard) => maintenanceApi.post('/JobCard', jobCard),
  updateJobCard: (id, jobCard) => maintenanceApi.put(`/JobCard/${id}`, jobCard),
  deleteJobCard: (id) => maintenanceApi.delete(`/JobCard/${id}`),
  getTasksByJobCard: (jobCardId) => maintenanceApi.get(`/JobCard/${jobCardId}/tasks`),
  addTaskToJobCard: (jobCardId, task) => maintenanceApi.post(`/JobCard/${jobCardId}/tasks`, task),
  updateTask: (taskId, task) => maintenanceApi.put(`/JobCard/tasks/${taskId}`, task),

  // Service Schedules
  getAllSchedules: () => maintenanceApi.get('/ServiceSchedule'),
  getScheduleById: (id) => maintenanceApi.get(`/ServiceSchedule/${id}`),
  getSchedulesByVehicle: (vehicleId) => maintenanceApi.get(`/ServiceSchedule/vehicle/${vehicleId}`),
  getUpcomingSchedules: () => maintenanceApi.get('/ServiceSchedule/upcoming'),
  getOverdueSchedules: () => maintenanceApi.get('/ServiceSchedule/overdue'),
  createSchedule: (schedule) => maintenanceApi.post('/ServiceSchedule', schedule),
  updateSchedule: (id, schedule) => maintenanceApi.put(`/ServiceSchedule/${id}`, schedule),
  deleteSchedule: (id) => maintenanceApi.delete(`/ServiceSchedule/${id}`),
};

export default maintenanceService;
