import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  LinearProgress,
  IconButton,
} from '@mui/material';
import {
  DirectionsCar,
  Build,
  Warning,
  Assignment,
  Schedule,
  CheckCircle,
  LocalShipping,
  Speed,
  ArrowForward,
} from '@mui/icons-material';
import fleetService from '../../services/fleetService';
import maintenanceService from '../../services/maintenanceService';

const StatCard = ({ title, value, icon, color, subtitle, actionLabel, onClick }) => (
  <Card 
    sx={{ 
      height: '100%',
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
          {actionLabel && (
            <Button size="small" sx={{ mt: 1, textTransform: 'none' }}>
              {actionLabel}
            </Button>
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

const FleetManagerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalVehicles: 0,
    activeVehicles: 0,
    inMaintenanceVehicles: 0,
    totalFleets: 0,
    openFaults: 0,
    activeJobCards: 0,
    upcomingServices: 0,
    overdueServices: 0,
    completionRate: 0,
  });
  const [recentJobCards, setRecentJobCards] = useState([]);
  const [fleetStats, setFleetStats] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [vehicles, fleets, openFaults, jobCards, upcoming, overdue] = await Promise.all([
        fleetService.getAllVehicles(),
        fleetService.getAllFleets(),
        maintenanceService.getOpenFaults(),
        maintenanceService.getAllJobCards(),
        maintenanceService.getUpcomingSchedules(),
        maintenanceService.getOverdueSchedules(),
      ]);

      const vehiclesData = vehicles.data || [];
      const activeJobCards = jobCards.data?.filter(j => j.status !== 'Completed') || [];
      const completedJobCards = jobCards.data?.filter(j => j.status === 'Completed') || [];
      
      setStats({
        totalVehicles: vehiclesData.length,
        activeVehicles: vehiclesData.filter(v => v.status === 'Active').length,
        inMaintenanceVehicles: vehiclesData.filter(v => v.status === 'Maintenance').length,
        totalFleets: fleets.data?.length || 0,
        openFaults: openFaults.data?.length || 0,
        activeJobCards: activeJobCards.length,
        upcomingServices: upcoming.data?.length || 0,
        overdueServices: overdue.data?.length || 0,
        completionRate: jobCards.data?.length > 0 
          ? Math.round((completedJobCards.length / jobCards.data.length) * 100) 
          : 0,
      });

      setRecentJobCards(activeJobCards.slice(0, 5));

      // Group by fleet
      const fleetsData = fleets.data || [];
      const fleetStatsData = fleetsData.map(fleet => ({
        name: fleet.name,
        vehicleCount: vehiclesData.filter(v => v.fleetId === fleet.id).length,
        activeCount: vehiclesData.filter(v => v.fleetId === fleet.id && v.status === 'Active').length,
      }));
      setFleetStats(fleetStatsData);
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
        Fleet Manager Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        Fleet operations and maintenance planning
      </Typography>

      {/* Key Metrics */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Vehicles"
            value={stats.totalVehicles}
            icon={<DirectionsCar sx={{ fontSize: 32 }} />}
            color="#0078d4"
            subtitle={`${stats.activeVehicles} active`}
            onClick={() => navigate('/vehicles')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="In Maintenance"
            value={stats.inMaintenanceVehicles}
            icon={<Build sx={{ fontSize: 32 }} />}
            color="#ffaa44"
            subtitle="Currently servicing"
            onClick={() => navigate('/vehicles')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Job Cards"
            value={stats.activeJobCards}
            icon={<Assignment sx={{ fontSize: 32 }} />}
            color="#8764b8"
            subtitle="In progress"
            onClick={() => navigate('/job-cards')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completion Rate"
            value={`${stats.completionRate}%`}
            icon={<CheckCircle sx={{ fontSize: 32 }} />}
            color="#107c10"
            subtitle="This month"
          />
        </Grid>
      </Grid>

      {/* Maintenance Overview */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Open Faults"
            value={stats.openFaults}
            icon={<Warning sx={{ fontSize: 32 }} />}
            color="#d83b01"
            subtitle="Requires assignment"
            onClick={() => navigate('/faults')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Upcoming Services"
            value={stats.upcomingServices}
            icon={<Schedule sx={{ fontSize: 32 }} />}
            color="#0078d4"
            subtitle="Next 30 days"
            onClick={() => navigate('/service-schedules')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Overdue Services"
            value={stats.overdueServices}
            icon={<Speed sx={{ fontSize: 32 }} />}
            color="#d83b01"
            subtitle="Needs scheduling"
            onClick={() => navigate('/service-schedules')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Managed Fleets"
            value={stats.totalFleets}
            icon={<LocalShipping sx={{ fontSize: 32 }} />}
            color="#107c10"
            subtitle="All locations"
            onClick={() => navigate('/fleets')}
          />
        </Grid>
      </Grid>

      {/* Detail Sections */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={600}>
                  Active Job Cards
                </Typography>
                <IconButton size="small" onClick={() => navigate('/job-cards')}>
                  <ArrowForward />
                </IconButton>
              </Box>
              {recentJobCards.length === 0 ? (
                <Box py={4} textAlign="center">
                  <Typography variant="body2" color="text.secondary">
                    No active job cards
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Job Number</TableCell>
                        <TableCell>Vehicle</TableCell>
                        <TableCell>Priority</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Assigned To</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentJobCards.map((job) => (
                        <TableRow key={job.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {job.jobNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {job.vehicle?.registrationNumber || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={job.priority || 'Normal'} 
                              size="small"
                              color={
                                job.priority === 'High' ? 'error' :
                                job.priority === 'Medium' ? 'warning' : 'default'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={job.status} 
                              size="small"
                              color="primary"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {job.assignedTo?.username || 'Unassigned'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Fleet Status Overview
              </Typography>
              <Box mt={2}>
                {fleetStats.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
                    No fleets available
                  </Typography>
                ) : (
                  fleetStats.map((fleet, index) => (
                    <Box key={index} mb={2}>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2" fontWeight={500}>
                          {fleet.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {fleet.activeCount}/{fleet.vehicleCount} active
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={fleet.vehicleCount > 0 ? (fleet.activeCount / fleet.vehicleCount) * 100 : 0}
                        sx={{ height: 8, borderRadius: 1 }}
                      />
                    </Box>
                  ))
                )}
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Quick Actions
              </Typography>
              <Box mt={2} display="flex" flexDirection="column" gap={1}>
                <Button 
                  variant="contained" 
                  fullWidth 
                  startIcon={<Assignment />}
                  onClick={() => navigate('/job-cards')}
                  sx={{ textTransform: 'none' }}
                >
                  Create Job Card
                </Button>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  startIcon={<Schedule />}
                  onClick={() => navigate('/service-schedules')}
                  sx={{ textTransform: 'none' }}
                >
                  Schedule Service
                </Button>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  startIcon={<DirectionsCar />}
                  onClick={() => navigate('/vehicles')}
                  sx={{ textTransform: 'none' }}
                >
                  Assign Vehicle
                </Button>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  startIcon={<CheckCircle />}
                  onClick={() => navigate('/dashboard')}
                  sx={{ textTransform: 'none' }}
                >
                  Review Reports
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FleetManagerDashboard;
