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
  Avatar,
  AvatarGroup,
  IconButton,
  Button,
} from '@mui/material';
import {
  DirectionsCar,
  People,
  Warning,
  Assignment,
  Schedule,
  LocalGasStation,
  Build,
  TrendingUp,
  ArrowForward,
} from '@mui/icons-material';
import fleetService from '../../services/fleetService';
import maintenanceService from '../../services/maintenanceService';

const StatCard = ({ title, value, icon, color, subtitle, trend, onClick }) => (
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
          {trend !== undefined && (
            <Box display="flex" alignItems="center" mt={1}>
              <TrendingUp 
                sx={{ 
                  fontSize: 16, 
                  color: trend > 0 ? '#107c10' : '#d83b01',
                  transform: trend < 0 ? 'rotate(180deg)' : 'none'
                }} 
              />
              <Typography variant="caption" color={trend > 0 ? '#107c10' : '#d83b01'} ml={0.5}>
                {trend > 0 ? '+' : ''}{trend}% this month
              </Typography>
            </Box>
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

const TenantAdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 3,
    totalVehicles: 0,
    totalFleets: 0,
    activeVehicles: 0,
    openFaults: 0,
    activeJobCards: 0,
    upcomingServices: 0,
    overdueServices: 0,
    monthlyMaintenanceCost: 0,
  });
  const [criticalVehicles, setCriticalVehicles] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [vehicles, fleets, openFaults, openJobCards, upcoming, overdue] = await Promise.all([
        fleetService.getAllVehicles(),
        fleetService.getAllFleets(),
        maintenanceService.getOpenFaults(),
        maintenanceService.getOpenJobCards(),
        maintenanceService.getUpcomingSchedules(),
        maintenanceService.getOverdueSchedules(),
      ]);

      setStats({
        totalUsers: 3,
        totalVehicles: vehicles.data?.length || 0,
        totalFleets: fleets.data?.length || 0,
        activeVehicles: vehicles.data?.filter(v => v.status === 'Active')?.length || 0,
        openFaults: openFaults.data?.length || 0,
        activeJobCards: openJobCards.data?.length || 0,
        upcomingServices: upcoming.data?.length || 0,
        overdueServices: overdue.data?.length || 0,
        monthlyMaintenanceCost: 0,
      });

      // Get vehicles with critical issues
      const critical = vehicles.data
        ?.filter(v => v.status === 'Maintenance' || v.status === 'Breakdown')
        ?.slice(0, 5) || [];
      setCriticalVehicles(critical);
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

  const operationalRate = stats.totalVehicles > 0 
    ? Math.round((stats.activeVehicles / stats.totalVehicles) * 100) 
    : 0;

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight={600}>
        Tenant Administrator Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        Organization overview and fleet management
      </Typography>

      {/* Primary Metrics */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Vehicles"
            value={stats.totalVehicles}
            icon={<DirectionsCar sx={{ fontSize: 32 }} />}
            color="#0078d4"
            subtitle={`${stats.activeVehicles} operational`}
            trend={5}
            onClick={() => navigate('/vehicles')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Fleet Users"
            value={stats.totalUsers}
            icon={<People sx={{ fontSize: 32 }} />}
            color="#8764b8"
            subtitle="All roles"
            trend={0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Operational Rate"
            value={`${operationalRate}%`}
            icon={<Build sx={{ fontSize: 32 }} />}
            color="#107c10"
            subtitle="Fleet efficiency"
            trend={3}
          />
        </Grid>
      </Grid>

      {/* Maintenance Metrics */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Faults"
            value={stats.openFaults}
            icon={<Warning sx={{ fontSize: 32 }} />}
            color="#d83b01"
            subtitle="Requires attention"
            onClick={() => navigate('/faults')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Job Cards"
            value={stats.activeJobCards}
            icon={<Assignment sx={{ fontSize: 32 }} />}
            color="#ffaa44"
            subtitle="In progress"
            onClick={() => navigate('/job-cards')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Upcoming Services"
            value={stats.upcomingServices}
            icon={<Schedule sx={{ fontSize: 32 }} />}
            color="#8764b8"
            subtitle="Next 30 days"
            onClick={() => navigate('/service-schedules')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Overdue Services"
            value={stats.overdueServices}
            icon={<LocalGasStation sx={{ fontSize: 32 }} />}
            color="#d83b01"
            subtitle="Needs scheduling"
            onClick={() => navigate('/service-schedules')}
          />
        </Grid>
      </Grid>

      {/* Details Section */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Vehicles Requiring Attention
              </Typography>
              {criticalVehicles.length === 0 ? (
                <Box py={4} textAlign="center">
                  <Typography variant="body2" color="text.secondary">
                    All vehicles are in good condition
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Vehicle</TableCell>
                        <TableCell>Registration</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Mileage</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {criticalVehicles.map((vehicle) => (
                        <TableRow key={vehicle.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {vehicle.manufacturer?.name} {vehicle.model}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {vehicle.registrationNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={vehicle.status}
                              size="small"
                              color={vehicle.status === 'Active' ? 'success' : 'warning'}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {vehicle.mileage?.toLocaleString()} km
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label="View" size="small" color="primary" />
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
                Fleet Distribution
              </Typography>
              <Box mt={2}>
                {stats.totalFleets === 0 ? (
                  <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
                    No fleets configured
                  </Typography>
                ) : (
                  <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="body2">Total Fleets</Typography>
                      <Chip label={stats.totalFleets} color="primary" size="small" />
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="body2">Vehicles per Fleet</Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {stats.totalFleets > 0 ? Math.round(stats.totalVehicles / stats.totalFleets) : 0}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">Active Technicians</Typography>
                      <AvatarGroup max={4}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>T1</Avatar>
                        <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>T2</Avatar>
                      </AvatarGroup>
                    </Box>
                  </Box>
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
                  fullWidth
                  variant="contained"
                  onClick={() => navigate('/vehicles')}
                  sx={{ justifyContent: 'flex-start', px: 2 }}
                >
                  Add New Vehicle
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate('/faults')}
                  sx={{ justifyContent: 'flex-start', px: 2 }}
                >
                  View All Faults
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate('/job-cards')}
                  sx={{ justifyContent: 'flex-start', px: 2 }}
                >
                  View All Job Cards
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate('/fleets')}
                  sx={{ justifyContent: 'flex-start', px: 2 }}
                >
                  Manage Fleets
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TenantAdminDashboard;
