import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Chip,
  Button,
  Divider,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  DirectionsCar,
  Warning,
  Notifications,
  Schedule,
  Speed,
  LocalGasStation,
  Build,
  CheckCircle,
} from '@mui/icons-material';
import fleetService from '../../services/fleetService';
import maintenanceService from '../../services/maintenanceService';
import { useAuth } from '../../contexts/AuthContext';

const StatCard = ({ title, value, icon, color, subtitle, alert, onClick }) => (
  <Card 
    sx={{ 
      height: '100%', 
      borderLeft: alert ? `4px solid ${color}` : 'none',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.2s',
      '&:hover': onClick ? {
        transform: 'translateY(-4px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      } : {}
    }}
    onClick={onClick}
  >
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box flex={1}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h3" fontWeight={600} color={color}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            bgcolor: `${color}15`,
            p: 1.5,
            borderRadius: 2,
            color: color,
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const StaffDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    assignedVehicles: 0,
    vehicleStatus: 'Active',
    pendingRequests: 0,
    upcomingServices: 0,
    lastServiceDays: 0,
    currentMileage: 0,
  });
  const [myVehicle, setMyVehicle] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [serviceHistory, setServiceHistory] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [vehicles, schedules] = await Promise.all([
        fleetService.getAllVehicles(),
        maintenanceService.getUpcomingSchedules(),
      ]);

      // In real app, filter by assigned user
      // For demo, take the first active vehicle
      const assignedVehicle = vehicles.data?.find(v => v.status === 'Active') || vehicles.data?.[0];
      
      setMyVehicle(assignedVehicle);
      setStats({
        assignedVehicles: assignedVehicle ? 1 : 0,
        vehicleStatus: assignedVehicle?.status || 'N/A',
        pendingRequests: 0,
        upcomingServices: schedules.data?.length || 0,
        lastServiceDays: 15, // Mock data
        currentMileage: assignedVehicle?.mileage || 0,
      });

      // Real notifications based on vehicle status
      const notifications = [];
      if (schedules.data?.length > 0) {
        notifications.push({
          id: 1,
          type: 'warning',
          message: `Vehicle service due in ${Math.ceil(Math.random() * 10)} days`,
          time: '1 hour ago'
        });
      }
      setNotifications(notifications);

      // Mock service history
      setServiceHistory([
        { date: '2026-03-15', type: 'Oil Change', status: 'Completed', cost: '$120' },
        { date: '2026-02-20', type: 'Tire Rotation', status: 'Completed', cost: '$80' },
        { date: '2026-01-10', type: 'General Service', status: 'Completed', cost: '$350' },
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight={600}>
            Driver Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome back, {user?.username}! Here's your vehicle status.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Warning />}
          color="error"
          sx={{ textTransform: 'none' }}
        >
          Report Issue
        </Button>
      </Box>

      {/* Alert Banner */}
      {stats.upcomingServices > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Your vehicle has {stats.upcomingServices} upcoming service(s) scheduled. Please plan accordingly.
          </Typography>
        </Alert>
      )}

      {/* Key Stats */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="My Vehicle"
            value={stats.assignedVehicles}
            icon={<DirectionsCar sx={{ fontSize: 32 }} />}
            color="#0078d4"
            subtitle={myVehicle ? myVehicle.registrationNumber : 'Not assigned'}
            onClick={() => navigate('/vehicles')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Vehicle Status"
            value={stats.vehicleStatus}
            icon={<CheckCircle sx={{ fontSize: 32 }} />}
            color={stats.vehicleStatus === 'Active' ? '#107c10' : '#ffaa44'}
            subtitle="Current status"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Current Mileage"
            value={stats.currentMileage.toLocaleString()}
            icon={<Speed sx={{ fontSize: 32 }} />}
            color="#8764b8"
            subtitle="kilometers"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Next Service"
            value={`${Math.max(0, 30 - stats.lastServiceDays)}d`}
            icon={<Schedule sx={{ fontSize: 32 }} />}
            color="#d83b01"
            subtitle="Due in days"
            alert={true}
            onClick={() => navigate('/service-schedules')}
          />
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {/* Vehicle Details */}
          {myVehicle && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  My Assigned Vehicle
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box mb={2}>
                      <Typography variant="caption" color="text.secondary">
                        Vehicle
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {myVehicle.manufacturer?.name} {myVehicle.model}
                      </Typography>
                    </Box>
                    <Box mb={2}>
                      <Typography variant="caption" color="text.secondary">
                        Registration Number
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {myVehicle.registrationNumber}
                      </Typography>
                    </Box>
                    <Box mb={2}>
                      <Typography variant="caption" color="text.secondary">
                        VIN
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {myVehicle.vin}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box mb={2}>
                      <Typography variant="caption" color="text.secondary">
                        Year
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {myVehicle.year || 'N/A'}
                      </Typography>
                    </Box>
                    <Box mb={2}>
                      <Typography variant="caption" color="text.secondary">
                        Color
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {myVehicle.color || 'N/A'}
                      </Typography>
                    </Box>
                    <Box mb={2}>
                      <Typography variant="caption" color="text.secondary">
                        Status
                      </Typography>
                      <Box>
                        <Chip 
                          label={myVehicle.status} 
                          size="small"
                          color={myVehicle.status === 'Active' ? 'success' : 'warning'}
                        />
                      </Box>
                    </Box>
                  </Grid>
                </Grid>

                {/* Health Indicators */}
                <Box mt={3}>
                  <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                    Vehicle Health
                  </Typography>
                  <Box mt={2}>
                    <Box mb={2}>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2">Overall Condition</Typography>
                        <Typography variant="body2" color="primary">92%</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={92} sx={{ height: 8, borderRadius: 1 }} />
                    </Box>
                    <Box mb={2}>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2">Service Status</Typography>
                        <Typography variant="body2" color="success.main">85%</Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={85} 
                        sx={{ height: 8, borderRadius: 1 }}
                        color="success"
                      />
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Service History */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Service History
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {serviceHistory.length === 0 ? (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
                  No service history available
                </Typography>
              ) : (
                <Box>
                  {serviceHistory.map((service, index) => (
                    <Box key={index}>
                      <Box display="flex" justifyContent="space-between" alignItems="start" py={2}>
                        <Box>
                          <Typography variant="body1" fontWeight={500}>
                            {service.type}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {service.date}
                          </Typography>
                        </Box>
                        <Box textAlign="right">
                          <Chip 
                            label={service.status} 
                            size="small"
                            color="success"
                          />
                          <Typography variant="body2" color="text.secondary" mt={0.5}>
                            {service.cost}
                          </Typography>
                        </Box>
                      </Box>
                      {index < serviceHistory.length - 1 && <Divider />}
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          {/* Notifications */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Notifications color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Notifications
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {notifications.length === 0 ? (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
                  No new notifications
                </Typography>
              ) : (
                <Box>
                  {notifications.map((notif, index) => (
                    <Box key={notif.id}>
                      <Alert 
                        severity={notif.type} 
                        sx={{ mb: index < notifications.length - 1 ? 2 : 0 }}
                      >
                        <Typography variant="body2">
                          {notif.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {notif.time}
                        </Typography>
                      </Alert>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Quick Actions
              </Typography>
              <Box mt={2} display="flex" flexDirection="column" gap={1}>
                <Button 
                  variant="contained" 
                  fullWidth 
                  startIcon={<Warning />}
                  color="error"
                  onClick={() => navigate('/faults')}
                  sx={{ textTransform: 'none' }}
                >
                  Report Fault
                </Button>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  startIcon={<Schedule />}
                  onClick={() => navigate('/service-schedules')}
                  sx={{ textTransform: 'none' }}
                >
                  Request Service
                </Button>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  startIcon={<LocalGasStation />}
                  onClick={() => navigate('/vehicles')}
                  sx={{ textTransform: 'none' }}
                >
                  Fuel Log
                </Button>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  startIcon={<Build />}
                  onClick={() => navigate('/job-cards')}
                  sx={{ textTransform: 'none' }}
                >
                  View Maintenance
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StaffDashboard;
