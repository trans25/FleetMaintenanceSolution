import { authApi } from './api';

const authService = {
  login: async (username, password) => {
    const response = await authApi.post('/Auth/login', { username, password });
    const { token, username: user, email, roles } = response.data;
    
    // Store token and user info
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify({ username: user, email, roles }));
    
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken: () => {
    return localStorage.getItem('token');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};

export default authService;
