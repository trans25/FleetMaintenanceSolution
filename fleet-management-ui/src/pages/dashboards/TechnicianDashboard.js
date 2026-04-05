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
  IconButton,
  Divider,
} from '@mui/material';
import {
  Assignment,
  CheckCircle,
  Schedule,
  PlayArrow,
  Build,
  Warning,
  Timer,
  ArrowForward,
} from '@mui/icons-material';
import maintenanceService from '../../services/maintenanceService';
import { useAuth } from '../../contexts/AuthContext';

const StatCard = ({ title, value, icon, color, subtitle, action, onClick }) => (
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
          {action && (
            <Box mt={1}>
              {action}
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

const TaskCard = ({ task, onStart, onComplete }) => (
  <Card variant="outlined" sx={{ mb: 2 }}>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="start">
        <Box flex={1}>
          <Typography variant="subtitle1" fontWeight={600}>
            {task.taskName}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {task.description}
          </Typography>
          <Box display="flex" gap={1} mt={1}>
            <Chip 
              label={task.status || 'Pending'} 
              size="small"
              color={task.status === 'Completed' ? 'success' : 'warning'}
            />
            {task.estimatedHours && (
              <Chip 
                icon={<Timer />}
                label={`${task.estimatedHours}h`} 
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </Box>
        <Box>
          {task.status !== 'Completed' && (
            <IconButton color="primary" size="small">
              <PlayArrow />
            </IconButton>
          )}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const TechnicianDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    assignedJobs: 0,
    inProgressJobs: 0,
    completedToday: 0,
    pendingTasks: 0,
  });
  const [myJobCards, setMyJobCards] = useState([]);
  const [recentFaults, setRecentFaults] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [allJobCards, openFaults] = await Promise.all([
        maintenanceService.getAllJobCards(),
        maintenanceService.getOpenFaults(),
      ]);

      // In a real app, filter by user.userId
      // For now, show all job cards as assigned
      const jobCards = allJobCards.data || [];
      const inProgress = jobCards.filter(j => j.status === 'In Progress');
      const pending = jobCards.filter(j => j.status === 'Pending' || j.status === 'Assigned');
      
      setStats({
        assignedJobs: jobCards.length,
        inProgressJobs: inProgress.length,
        completedToday: 0, // Would filter by date
        pendingTasks: pending.length,
      });

      setMyJobCards(jobCards.slice(0, 5));
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight={600}>
            Technician Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome back, {user?.username}! Here are your assigned tasks.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<CheckCircle />}
          sx={{ textTransform: 'none' }}
        >
          Clock In
        </Button>
      </Box>

      {/* Work Summary */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Assigned Jobs"
            value={stats.assignedJobs}
            icon={<Assignment sx={{ fontSize: 32 }} />}
            color="#0078d4"
            subtitle="Total workload"
            onClick={() => navigate('/job-cards')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="In Progress"
            value={stats.inProgressJobs}
            icon={<Build sx={{ fontSize: 32 }} />}
            color="#ffaa44"
            subtitle="Currently working"
            onClick={() => navigate('/job-cards')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Tasks"
            value={stats.pendingTasks}
            icon={<Schedule sx={{ fontSize: 32 }} />}
            color="#8764b8"
            subtitle="Awaiting start"
            onClick={() => navigate('/job-cards')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completed Today"
            value={stats.completedToday}
            icon={<CheckCircle sx={{ fontSize: 32 }} />}
            color="#107c10"
            subtitle="Good progress!"
          />
        </Grid>
      </Grid>

      {/* Main Work Area */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={600}>
                  My Job Cards
                </Typography>
                <Button 
                  size="small" 
                  endIcon={<ArrowForward />}
                  sx={{ textTransform: 'none' }}
                >
                  View All
                </Button>
              </Box>
              
              {myJobCards.length === 0 ? (
                <Box py={6} textAlign="center">
                  <Typography variant="body2" color="text.secondary">
                    No job cards assigned yet
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Job Number</TableCell>
                        <TableCell>Vehicle</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Priority</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {myJobCards.map((job) => (
                        <TableRow key={job.id} hover>
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
                            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                              {job.title || job.description}
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
                              color={
                                job.status === 'Completed' ? 'success' :
                                job.status === 'In Progress' ? 'primary' : 'default'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="small" 
                              variant="contained"
                              sx={{ textTransform: 'none' }}
                            >
                              {job.status === 'Pending' ? 'Start' : 'Update'}
                            </Button>
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

        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Recent Faults
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {recentFaults.length === 0 ? (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
                  No recent faults
                </Typography>
              ) : (
                <Box>
                  {recentFaults.map((fault) => (
                    <Box key={fault.id} mb={2}>
                      <Box display="flex" alignItems="start" gap={1}>
                        <Warning color="error" sx={{ fontSize: 20, mt: 0.5 }} />
                        <Box flex={1}>
                          <Typography variant="body2" fontWeight={500}>
                            {fault.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Vehicle: {fault.vehicle?.registrationNumber || 'N/A'}
                          </Typography>
                          <Box mt={0.5}>
                            <Chip 
                              label={fault.severity || 'Medium'} 
                              size="small"
                              color={
                                fault.severity === 'Critical' ? 'error' :
                                fault.severity === 'High' ? 'warning' : 'default'
                              }
                            />
                          </Box>
                        </Box>
                      </Box>
                      {recentFaults.indexOf(fault) < recentFaults.length - 1 && (
                        <Divider sx={{ mt: 2 }} />
                      )}
                    </Box>
                  ))}
                </Box>
              )}
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
                  startIcon={<Build />}
                  onClick={() => navigate('/job-cards')}
                  sx={{ textTransform: 'none' }}
                >
                  Update Job Status
                </Button>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  startIcon={<Warning />}
                  onClick={() => navigate('/faults')}
                  sx={{ textTransform: 'none' }}
                >
                  Report Issue
                </Button>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  startIcon={<Schedule />}
                  onClick={() => navigate('/service-schedules')}
                  sx={{ textTransform: 'none' }}
                >
                  My Schedule
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TechnicianDashboard;
