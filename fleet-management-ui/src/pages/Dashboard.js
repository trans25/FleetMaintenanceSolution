import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
} from '@mui/material';
import {
  DirectionsCar,
  Warning,
  Assignment,
  Schedule,
  TrendingUp,
  CheckCircle,
} from '@mui/icons-material';
import fleetService from '../services/fleetService';
import maintenanceService from '../services/maintenanceService';

const StatCard = ({ title, value, icon, color, subtitle }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
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
            bgcolor: `${color}10`,
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

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalVehicles: 0,
    activeVehicles: 0,
    openFaults: 0,
    openJobCards: 0,
    upcomingServices: 0,
    overdueServices: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [vehicles, openFaults, openJobCards, upcoming, overdue] = await Promise.all([
        fleetService.getAllVehicles(),
        maintenanceService.getOpenFaults(),
        maintenanceService.getOpenJobCards(),
        maintenanceService.getUpcomingSchedules(),
        maintenanceService.getOverdueSchedules(),
      ]);

      setStats({
        totalVehicles: vehicles.data?.length || 0,
        activeVehicles: vehicles.data?.filter(v => v.status === 'Active')?.length || 0,
        openFaults: openFaults.data?.length || 0,
        openJobCards: openJobCards.data?.length || 0,
        upcomingServices: upcoming.data?.length || 0,
        overdueServices: overdue.data?.length || 0,
      });
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
      <Typography variant="h4" gutterBottom fontWeight={600}>
        Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        Welcome back! Here's what's happening with your fleet today.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Vehicles"
            value={stats.totalVehicles}
            icon={<DirectionsCar sx={{ fontSize: 32 }} />}
            color="#0078d4"
            subtitle={`${stats.activeVehicles} active`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Open Faults"
            value={stats.openFaults}
            icon={<Warning sx={{ fontSize: 32 }} />}
            color="#d83b01"
            subtitle="Requires attention"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Active Job Cards"
            value={stats.openJobCards}
            icon={<Assignment sx={{ fontSize: 32 }} />}
            color="#ffaa44"
            subtitle="In progress"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Upcoming Services"
            value={stats.upcomingServices}
            icon={<Schedule sx={{ fontSize: 32 }} />}
            color="#8764b8"
            subtitle="Next 30 days"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Overdue Services"
            value={stats.overdueServices}
            icon={<TrendingUp sx={{ fontSize: 32 }} />}
            color="#d83b01"
            subtitle="Needs scheduling"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Fleet Status"
            value={Math.round((stats.activeVehicles / stats.totalVehicles) * 100) || 0}
            icon={<CheckCircle sx={{ fontSize: 32 }} />}
            color="#107c10"
            subtitle="% operational"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
