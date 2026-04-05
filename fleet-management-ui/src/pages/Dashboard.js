import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import SystemAdminDashboard from './dashboards/SystemAdminDashboard';
import TenantAdminDashboard from './dashboards/TenantAdminDashboard';
import FleetManagerDashboard from './dashboards/FleetManagerDashboard';
import TechnicianDashboard from './dashboards/TechnicianDashboard';
import StaffDashboard from './dashboards/StaffDashboard';
import { Box, Typography, CircularProgress } from '@mui/material';

const Dashboard = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!user || !user.roles || user.roles.length === 0) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography variant="h5" color="text.secondary">
          No role assigned
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={1}>
          Please contact your administrator
        </Typography>
      </Box>
    );
  }

  // Get the primary role (first role in the array)
  const primaryRole = user.roles[0];

  // Route to appropriate dashboard based on role
  switch (primaryRole) {
    case 'SystemAdmin':
      return <SystemAdminDashboard />;
    
    case 'TenantAdmin':
      return <TenantAdminDashboard />;
    
    case 'FleetManager':
      return <FleetManagerDashboard />;
    
    case 'Technician':
      return <TechnicianDashboard />;
    
    case 'Staff':
    case 'Guest':
      return <StaffDashboard />;
    
    case 'Auditor':
      return <TenantAdminDashboard />; // Auditors see tenant-level view
    
    default:
      // Fallback to Staff dashboard for unknown roles
      return <StaffDashboard />;
  }
};

export default Dashboard;
