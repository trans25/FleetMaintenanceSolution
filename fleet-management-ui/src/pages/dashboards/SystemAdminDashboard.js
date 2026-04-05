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
  Paper,
  Chip,
  LinearProgress,
  IconButton,
} from '@mui/material';
import {
  Business,
  People,
  DirectionsCar,
  Warning,
  Assessment,
  TrendingUp,
  CheckCircle,
  Schedule,
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
              <TrendingUp sx={{ fontSize: 16, color: trend > 0 ? '#107c10' : '#d83b01' }} />
              <Typography variant="caption" color={trend > 0 ? '#107c10' : '#d83b01'} ml={0.5}>
                {trend > 0 ? '+' : ''}{trend}% from last month
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

const SystemAdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTenants: 1,
    totalUsers: 3,
    totalVehicles: 0,
    totalFleets: 0,
    activeFaults: 0,
    activeJobCards: 0,
    systemHealth: 98,
    overdueServices: 0,
  });
  const [recentFaults, setRecentFaults] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [vehicles, fleets, openFaults, openJobCards, overdueServices] = await Promise.all([
        fleetService.getAllVehicles(),
        fleetService.getAllFleets(),
        maintenanceService.getOpenFaults(),
        maintenanceService.getOpenJobCards(),
        maintenanceService.getOverdueSchedules(),
      ]);

      setStats({
        totalTenants: 1,
        totalUsers: 3,
        totalVehicles: vehicles.data?.length || 0,
        totalFleets: fleets.data?.length || 0,
        activeFaults: openFaults.data?.length || 0,
        activeJobCards: openJobCards.data?.length || 0,
        systemHealth: 98,
        overdueServices: overdueServices.data?.length || 0,
      });

      // Get recent faults for activity feed
      setRecentFaults((openFaults.data || []).slice(0, 4));
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
        System Administrator Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        Complete system overview and management
      </Typography>

      {/* Key Metrics */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Tenants"
            value={stats.totalTenants}
            icon={<Business sx={{ fontSize: 32 }} />}
            color="#0078d4"
            subtitle="Active organizations"
            trend={0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<People sx={{ fontSize: 32 }} />}
            color="#8764b8"
            subtitle="All roles"
            trend={0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Vehicles"
            value={stats.totalVehicles}
            icon={<DirectionsCar sx={{ fontSize: 32 }} />}
            color="#107c10"
            subtitle={`${stats.totalFleets} fleets`}
            onClick={() => navigate('/vehicles')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="System Health"
            value={`${stats.systemHealth}%`}
            icon={<CheckCircle sx={{ fontSize: 32 }} />}
            color="#107c10"
            subtitle="All systems operational"
          />
        </Grid>
      </Grid>

      {/* Operational Metrics */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Faults"
            value={stats.activeFaults}
            icon={<Warning sx={{ fontSize: 32 }} />}
            color="#d83b01"
            subtitle="Across all tenants"
            onClick={() => navigate('/faults')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Job Cards"
            value={stats.activeJobCards}
            icon={<Assessment sx={{ fontSize: 32 }} />}
            color="#ffaa44"
            subtitle="In progress"
            onClick={() => navigate('/job-cards')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Overdue Services"
            value={stats.overdueServices}
            icon={<Schedule sx={{ fontSize: 32 }} />}
            color="#d83b01"
            subtitle="Needs attention"
            onClick={() => navigate('/service-schedules')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Fleets"
            value={stats.totalFleets}
            icon={<Business sx={{ fontSize: 32 }} />}
            color="#0078d4"
            subtitle="Managed fleets"
            onClick={() => navigate('/fleets')}
          />
        </Grid>
      </Grid>

      {/* System Health Status */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                System Health Metrics
              </Typography>
              <Box mt={2}>
                <Box mb={2}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2">Database Performance</Typography>
                    <Typography variant="body2" color="primary">99%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={99} sx={{ height: 8, borderRadius: 1 }} />
                </Box>
                <Box mb={2}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2">API Response Time</Typography>
                    <Typography variant="body2" color="primary">95%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={95} sx={{ height: 8, borderRadius: 1 }} />
                </Box>
                <Box mb={2}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2">Storage Capacity</Typography>
                    <Typography variant="body2" color="warning.main">72%</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={72} 
                    sx={{ height: 8, borderRadius: 1 }}
                    color="warning"
                  />
                </Box>
                <Box>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2">User Activity</Typography>
                    <Typography variant="body2" color="primary">88%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={88} sx={{ height: 8, borderRadius: 1 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={600}>
                  Recent Faults
                </Typography>
                <IconButton size="small" onClick={() => navigate('/faults')}>
                  <ArrowForward />
                </IconButton>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Vehicle</TableCell>
                      <TableCell>Fault</TableCell>
                      <TableCell>Severity</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentFaults.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <Typography variant="body2" color="text.secondary" py={2}>
                            No recent faults
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentFaults.map((fault) => (
                        <TableRow 
                          key={fault.id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => navigate('/faults')}
                        >
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {fault.vehicleId || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                              {fault.title}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={fault.severity || 'Medium'} 
                              size="small"
                              color={
                                fault.severity === 'Critical' ? 'error' :
                                fault.severity === 'High' ? 'warning' : 'default'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={fault.status || 'Open'} 
                              size="small"
                              color={fault.status === 'Resolved' ? 'success' : 'warning'}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SystemAdminDashboard;
