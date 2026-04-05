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
import { maintenanceApi } from '../services/api';
import fleetService from '../services/fleetService';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

const ServiceSchedules = () => {
  const { user } = useAuth();
  const isSystemAdmin = user?.roles?.includes('SystemAdmin');
  const isTenantAdmin = user?.roles?.includes('TenantAdmin');
  const userTenantId = user?.tenantId;
  
  const [schedules, setSchedules] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, name: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [formData, setFormData] = useState({
    tenantId: '',
    vehicleId: '',
    serviceType: 'Regular Maintenance',
    scheduledDate: '',
    mileageAtService: 0,
    description: '',
    status: 'Scheduled',
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
    fetchTenants();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await maintenanceApi.get('/ServiceSchedule');
      const allSchedules = response.data || [];
      
      if (isTenantAdmin) {
        // Get vehicles for tenant
        const fleetsRes = await fleetService.getAllFleets();
        const fleets = (fleetsRes.data || []).filter(f => f.tenantId === userTenantId);
        const fleetIds = new Set(fleets.map(f => f.id));
        
        const vehiclesRes = await fleetService.getAllVehicles();
        const tenantVehicles = (vehiclesRes.data || []).filter(v => fleetIds.has(v.fleetId));
        const vehicleIds = new Set(tenantVehicles.map(v => v.id));
        
        // Filter schedules by tenant vehicles
        const filteredSchedules = allSchedules.filter(s => vehicleIds.has(s.vehicleId));
        setSchedules(filteredSchedules);
      } else {
        setSchedules(allSchedules);
      }
    } catch (error) {
      showSnackbar('Failed to fetch service schedules', 'error');
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await fleetService.getAllVehicles();
      const allVehicles = response.data || [];
      
      if (isTenantAdmin) {
        const fleetsRes = await fleetService.getAllFleets();
        const fleets = (fleetsRes.data || []).filter(f => f.tenantId === userTenantId);
        const fleetIds = new Set(fleets.map(f => f.id));
        const filteredVehicles = allVehicles.filter(v => fleetIds.has(v.fleetId));
        setVehicles(filteredVehicles);
      } else {
        setVehicles(allVehicles);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const fetchTenants = async () => {
    try {
      const response = await fleetService.getAllTenants();
      setTenants(response.data);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
  };

  const handleOpenDialog = (schedule = null) => {
    if (schedule) {
      setSelectedSchedule(schedule);
      setFormData({
        tenantId: schedule.tenantId || (tenants[0]?.id || ''),
        vehicleId: schedule.vehicleId,
        serviceType: schedule.serviceType,
        scheduledDate: schedule.scheduledDate ? schedule.scheduledDate.split('T')[0] : '',
        mileageAtService: schedule.mileageAtService || 0,
        description: schedule.description || '',
        status: schedule.status || 'Scheduled',
      });
    } else {
      setSelectedSchedule(null);
      setFormData({
        tenantId: tenants[0]?.id || '',
        vehicleId: '',
        serviceType: 'Regular Maintenance',
        scheduledDate: '',
        mileageAtService: 0,
        description: '',
        status: 'Scheduled',
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
        tenantId: parseInt(formData.tenantId),
        vehicleId: parseInt(formData.vehicleId),
        mileageAtService: parseInt(formData.mileageAtService),
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

  const handleDeleteClick = (schedule) => {
    setDeleteDialog({ open: true, id: schedule.id, name: `${schedule.serviceType} - ${schedule.scheduledDate}` });
  };

  const handleDeleteConfirm = async () => {
    try {
      await maintenanceApi.delete(`/ServiceSchedule/${deleteDialog.id}`);
      showSnackbar('Service schedule deleted successfully');
      fetchSchedules();
    } catch (error) {
      showSnackbar('Failed to delete service schedule', 'error');
      console.error('Error deleting schedule:', error);
    }
    setDeleteDialog({ open: false, id: null, name: '' });
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, id: null, name: '' });
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
        if (!params.row || params.value === undefined) return '';
        const vehicle = vehicles.find((v) => v.id === params.value);
        return vehicle?.registrationNumber || params.value || '';
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
        const status = params.row.status || 'Scheduled';
        const overdue = status !== 'Completed' && isOverdue(params.row.scheduledDate);
        
        if (status === 'Completed') {
          return <Chip label="Completed" color="success" size="small" />;
        } else if (overdue) {
          return <Chip label="Overdue" color="error" size="small" />;
        } else {
          return <Chip label="Scheduled" color="primary" size="small" />;
        }
      },
    },
    {
      field: 'mileageAtService',
      headerName: 'Mileage',
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
          <IconButton size="small" color="error" onClick={() => handleDeleteClick(params.row)}>
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
                {schedules.filter(s => s.status !== 'Completed' && !isOverdue(s.scheduledDate)).length}
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
                {schedules.filter(s => s.status !== 'Completed' && isOverdue(s.scheduledDate)).length}
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
                {schedules.filter(s => s.status === 'Completed').length}
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
            {user?.roles?.includes('SystemAdmin') && (
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Tenant"
                  value={formData.tenantId}
                  onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                  required
                >
                  {tenants.map((tenant) => (
                    <MenuItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}
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
                label="Mileage at Service (km)"
                value={formData.mileageAtService}
                onChange={(e) => setFormData({ ...formData, mileageAtService: e.target.value })}
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

      <Dialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <DeleteIcon color="error" />
            <Typography variant="h6" component="span">Confirm Delete</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to delete this service schedule?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            <strong>{deleteDialog.name}</strong>
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action cannot be undone. The scheduled service will be permanently removed.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleDeleteCancel} variant="outlined" color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error" startIcon={<DeleteIcon />}>
            Delete
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
