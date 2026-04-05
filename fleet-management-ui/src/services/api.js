import axios from 'axios';

const API_BASE_URLS = {
  auth: 'http://localhost:5001/api',
  fleet: 'http://localhost:5002/api',
  maintenance: 'http://localhost:5003/api',
};

// axios instances for each service
const authApi = axios.create({ baseURL: API_BASE_URLS.auth });
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

addAuthInterceptor(fleetApi);
addAuthInterceptor(maintenanceApi);

export { authApi, fleetApi, maintenanceApi };
