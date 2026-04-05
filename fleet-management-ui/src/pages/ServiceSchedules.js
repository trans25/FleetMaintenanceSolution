import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  IconButton,
  MenuItem,
  Alert,
  Snackbar,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { maintenanceApi, fleetApi } from '../services/api';
import { format } from 'date-fns';

const ServiceSchedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [formData, setFormData] = useState({
    vehicleId: '',
    serviceType: 'Regular Maintenance',
    scheduledDate: '',
    mileageInterval: 0,
    description: '',
    isCompleted: false,
  });

  const serviceTypes = [
    'Regular Maintenance',
    'Oil Change',
    'Tire Rotation',
    'Brake Inspection',
    'Engine Service',
    'Transmission Service',
    'Annual Inspection',
  ];

  useEffect(() => {
    fetchSchedules();
    fetchVehicles();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await maintenanceApi.get('/ServiceSchedule');
      setSchedules(response.data);
    } catch (error) {
      showSnackbar('Failed to fetch service schedules', 'error');
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await fleetApi.get('/Vehicle');
      setVehicles(response.data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const handleOpenDialog = (schedule = null) => {
    if (schedule) {
      setSelectedSchedule(schedule);
      setFormData({
        vehicleId: schedule.vehicleId,
        serviceType: schedule.serviceType,
        scheduledDate: schedule.scheduledDate ? schedule.scheduledDate.split('T')[0] : '',
        mileageInterval: schedule.mileageInterval || 0,
        description: schedule.description || '',
        isCompleted: schedule.isCompleted,
      });
    } else {
      setSelectedSchedule(null);
      setFormData({
        vehicleId: '',
        serviceType: 'Regular Maintenance',
        scheduledDate: '',
        mileageInterval: 0,
        description: '',
        isCompleted: false,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedSchedule(null);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        vehicleId: parseInt(formData.vehicleId),
        mileageInterval: parseInt(formData.mileageInterval),
        scheduledDate: new Date(formData.scheduledDate).toISOString(),
      };

      if (selectedSchedule) {
        await maintenanceApi.put(`/ServiceSchedule/${selectedSchedule.id}`, {
          ...payload,
          id: selectedSchedule.id,
        });
        showSnackbar('Service schedule updated successfully');
      } else {
        await maintenanceApi.post('/ServiceSchedule', payload);
        showSnackbar('Service schedule created successfully');
      }
      
      fetchSchedules();
      handleCloseDialog();
    } catch (error) {
      showSnackbar('Failed to save service schedule', 'error');
      console.error('Error saving schedule:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this service schedule?')) {
      try {
        await maintenanceApi.delete(`/ServiceSchedule/${id}`);
        showSnackbar('Service schedule deleted successfully');
        fetchSchedules();
      } catch (error) {
        showSnackbar('Failed to delete service schedule', 'error');
        console.error('Error deleting schedule:', error);
      }
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const isOverdue = (scheduledDate) => {
    return new Date(scheduledDate) < new Date();
  };

  const columns = [
    {
      field: 'vehicleId',
      headerName: 'Vehicle',
      width: 150,
      renderCell: (params) => {
        const vehicle = vehicles.find((v) => v.id === params.value);
        return vehicle?.registrationNumber || params.value;
      },
    },
    { field: 'serviceType', headerName: 'Service Type', width: 200 },
    {
      field: 'scheduledDate',
      headerName: 'Scheduled Date',
      width: 150,
      valueFormatter: (params) => params ? format(new Date(params), 'yyyy-MM-dd') : '',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => {
        const completed = params.row.isCompleted;
        const overdue = !completed && isOverdue(params.row.scheduledDate);
        
        if (completed) {
          return <Chip label="Completed" color="success" size="small" />;
        } else if (overdue) {
          return <Chip label="Overdue" color="error" size="small" />;
        } else {
          return <Chip label="Scheduled" color="primary" size="small" />;
        }
      },
    },
    {
      field: 'mileageInterval',
      headerName: 'Mileage Interval',
      width: 150,
      valueFormatter: (params) => params ? `${params.toLocaleString()} km` : '-',
    },
    { field: 'description', headerName: 'Description', width: 200 },
    {
      field: 'completedDate',
      headerName: 'Completed Date',
      width: 150,
      valueFormatter: (params) => params ? format(new Date(params), 'yyyy-MM-dd') : '-',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton size="small" onClick={() => handleOpenDialog(params.row)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Service Schedules</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Schedule Service
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: '#e3f2fd' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Upcoming Services
              </Typography>
              <Typography variant="h4">
                {schedules.filter(s => !s.isCompleted && !isOverdue(s.scheduledDate)).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: '#ffebee' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Overdue Services
              </Typography>
              <Typography variant="h4">
                {schedules.filter(s => !s.isCompleted && isOverdue(s.scheduledDate)).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: '#e8f5e9' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Completed Services
              </Typography>
              <Typography variant="h4">
                {schedules.filter(s => s.isCompleted).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <DataGrid
            rows={schedules}
            columns={columns}
            loading={loading}
            autoHeight
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            disableSelectionOnClick
            sx={{
              '& .MuiDataGrid-cell:focus': { outline: 'none' },
              '& .MuiDataGrid-row:hover': { bgcolor: 'action.hover' },
            }}
          />
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedSchedule ? 'Edit Service Schedule' : 'Create Service Schedule'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Vehicle"
                value={formData.vehicleId}
                onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                required
              >
                {vehicles.map((vehicle) => (
                  <MenuItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.registrationNumber} - {vehicle.model}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Service Type"
                value={formData.serviceType}
                onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                required
              >
                {serviceTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Scheduled Date"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Mileage Interval (km)"
                value={formData.mileageInterval}
                onChange={(e) => setFormData({ ...formData, mileageInterval: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {selectedSchedule ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ServiceSchedules;
