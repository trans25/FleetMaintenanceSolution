import React from 'react';
import { Box, Typography, Card, CardContent, Button, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const SessionDebug = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const localStorageUser = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Session Debug Information</Typography>
      
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>User Context</Typography>
          <pre>{JSON.stringify(user, null, 2)}</pre>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>LocalStorage User</Typography>
          <pre>{JSON.stringify(localStorageUser, null, 2)}</pre>
        </CardContent>
      </Card>

      {user && !user.tenantId && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6">TenantId is missing!</Typography>
          <Typography>
            Your session doesn't have a tenantId. Please log out and log back in to refresh your session.
          </Typography>
        </Alert>
      )}

      <Button variant="contained" color="primary" onClick={handleLogout}>
        Logout and Login Again
      </Button>
    </Box>
  );
};

export default SessionDebug;
