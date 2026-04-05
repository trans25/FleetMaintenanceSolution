import { authApi } from './api';

const authService = {
  login: async (username, password) => {
    const response = await authApi.post('/Auth/login', { username, password });
    const { token, username: user, email, tenantId, roles } = response.data;
    
    // Debug logging
    console.log('Login response:', { token: token?.substring(0, 20) + '...', user, email, tenantId, roles });
    
    // Store token and user info - ensure tenantId is a number
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify({ 
      username: user, 
      email, 
      tenantId: tenantId || null, 
      roles 
    }));
    
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
