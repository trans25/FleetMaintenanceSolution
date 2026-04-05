import axios from 'axios';

// Use environment variables for API URLs, with fallback to localhost for development
const API_BASE_URLS = {
  auth: process.env.REACT_APP_AUTH_API_URL || 'http://localhost:5001/api',
  vehicle: process.env.REACT_APP_VEHICLE_API_URL || 'http://localhost:5000/api',
  fleet: process.env.REACT_APP_FLEET_API_URL || 'http://localhost:5002/api',
  maintenance: process.env.REACT_APP_MAINTENANCE_API_URL || 'http://localhost:5003/api',
};

// Log API URLs in development
if (process.env.NODE_ENV === 'development') {
  console.log('API Configuration:', API_BASE_URLS);
}

// axios instances for each service
const authApi = axios.create({ baseURL: API_BASE_URLS.auth });
const vehicleApi = axios.create({ baseURL: API_BASE_URLS.vehicle });
const fleetApi = axios.create({ baseURL: API_BASE_URLS.fleet });
const maintenanceApi = axios.create({ baseURL: API_BASE_URLS.maintenance });

// Addng auth token to requests
const addAuthInterceptor = (apiInstance) => {
  apiInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  apiInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );
};

addAuthInterceptor(authApi);
addAuthInterceptor(vehicleApi);
addAuthInterceptor(fleetApi);
addAuthInterceptor(maintenanceApi);

export { authApi, vehicleApi, fleetApi, maintenanceApi };
