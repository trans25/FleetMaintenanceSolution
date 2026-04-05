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
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { maintenanceApi } from '../services/api';
import fleetService from '../services/fleetService';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

const JobCards = () => {
  const { user } = useAuth();
  const isSystemAdmin = user?.roles?.includes('SystemAdmin');
  const isTenantAdmin = user?.roles?.includes('TenantAdmin');
  const userTenantId = user?.tenantId;
  
  const [jobCards, setJobCards] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedJobCard, setSelectedJobCard] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, name: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [formData, setFormData] = useState({
    tenantId: '',
    jobNumber: '',
    vehicleId: '',
    description: '',
    status: 'Open',
    priority: 'Medium',
    assignedToUserId: 1,
    estimatedCost: 0,
    actualCost: 0,
  });

  const statusColors = {
    Open: 'primary',
    'In Progress': 'warning',
    Completed: 'success',
    Cancelled: 'error',
  };

  const priorityColors = {
    Low: 'success',
    Medium: 'warning',
    High: 'error',
    Critical: 'error',
  };

  useEffect(() => {
    fetchJobCards();
    fetchVehicles();
    fetchTenants();
  }, []);

  const fetchJobCards = async () => {
    try {
      setLoading(true);
      const response = await maintenanceApi.get('/JobCard');
      const allJobCards = response.data || [];
      
      if (isTenantAdmin) {
        // Get vehicles for tenant
        const fleetsRes = await fleetService.getAllFleets();
        const fleets = (fleetsRes.data || []).filter(f => f.tenantId === userTenantId);
        const fleetIds = new Set(fleets.map(f => f.id));
        
        const vehiclesRes = await fleetService.getAllVehicles();
        const tenantVehicles = (vehiclesRes.data || []).filter(v => fleetIds.has(v.fleetId));
        const vehicleIds = new Set(tenantVehicles.map(v => v.id));
        
        // Filter job cards by tenant vehicles
        const filteredJobCards = allJobCards.filter(jc => vehicleIds.has(jc.vehicleId));
        setJobCards(filteredJobCards);
      } else {
        setJobCards(allJobCards);
      }
    } catch (error) {
      showSnackbar('Failed to fetch job cards', 'error');
      console.error('Error fetching job cards:', error);
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

  const handleOpenDialog = (jobCard = null) => {
    if (jobCard) {
      setSelectedJobCard(jobCard);
      setFormData({
        tenantId: jobCard.tenantId || (tenants[0]?.id || ''),
        jobNumber: jobCard.jobNumber,
        vehicleId: jobCard.vehicleId,
        description: jobCard.description,
        status: jobCard.status,
        priority: jobCard.priority,
 assignedToUserId: jobCard.assignedToUserId || 1,
        estimatedCost: jobCard.estimatedCost || 0,
        actualCost: jobCard.actualCost || 0,
      });
    } else {
      setSelectedJobCard(null);
      setFormData({
        tenantId: tenants[0]?.id || '',
        jobNumber: `JC-${Date.now()}`,
        vehicleId: '',
        description: '',
        status: 'Open',
        priority: 'Medium',
        assignedToUserId: 1,
        estimatedCost: 0,
        actualCost: 0,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedJobCard(null);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        tenantId: parseInt(formData.tenantId),
        vehicleId: parseInt(formData.vehicleId),
        assignedToUserId: parseInt(formData.assignedToUserId),
        estimatedCost: parseFloat(formData.estimatedCost),
        actualCost: parseFloat(formData.actualCost),
      };

      if (selectedJobCard) {
        await maintenanceApi.put(`/JobCard/${selectedJobCard.id}`, {
          ...payload,
          id: selectedJobCard.id,
        });
        showSnackbar('Job card updated successfully');
      } else {
        await maintenanceApi.post('/JobCard', payload);
        showSnackbar('Job card created successfully');
      }
      
      fetchJobCards();
      handleCloseDialog();
    } catch (error) {
      showSnackbar('Failed to save job card', 'error');
      console.error('Error saving job card:', error);
    }
  };

  const handleDeleteClick = (jobCard) => {
    setDeleteDialog({ open: true, id: jobCard.id, name: jobCard.jobNumber });
  };

  const handleDeleteConfirm = async () => {
    try {
      await maintenanceApi.delete(`/JobCard/${deleteDialog.id}`);
      showSnackbar('Job card deleted successfully');
      fetchJobCards();
    } catch (error) {
      showSnackbar('Failed to delete job card', 'error');
      console.error('Error deleting job card:', error);
    }
    setDeleteDialog({ open: false, id: null, name: '' });
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, id: null, name: '' });
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const columns = [
    { field: 'jobNumber', headerName: 'Job Number', width: 150, fontWeight: 600 },
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
    { field: 'description', headerName: 'Description', width: 250 },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => (
        <Chip label={params.value} color={statusColors[params.value]} size="small" />
      ),
    },
    {
      field: 'priority',
      headerName: 'Priority',
      width: 110,
      renderCell: (params) => (
        <Chip label={params.value} color={priorityColors[params.value]} size="small" />
      ),
    },
    {
      field: 'estimatedCost',
      headerName: 'Est. Cost',
      width: 110,
      valueFormatter: (params) => `R ${params}`,
    },
    {
      field: 'actualCost',
      headerName: 'Actual Cost',
      width: 120,
      valueFormatter: (params) => `R ${params}`,
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 120,
      valueFormatter: (params) => params ? format(new Date(params), 'yyyy-MM-dd') : '',
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
        <Typography variant="h4">Job Cards</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Create Job Card
        </Button>
      </Box>

      <Card>
        <CardContent>
          <DataGrid
            rows={jobCards}
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
          {selectedJobCard ? 'Edit Job Card' : 'Create Job Card'}
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
                label="Job Number"
                value={formData.jobNumber}
                onChange={(e) => setFormData({ ...formData, jobNumber: e.target.value })}
                required
              />
            </Grid>
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
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                {['Open', 'In Progress', 'Completed', 'Cancelled'].map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                {['Low', 'Medium', 'High', 'Critical'].map((priority) => (
                  <MenuItem key={priority} value={priority}>
                    {priority}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Estimated Cost (R)"
                value={formData.estimatedCost}
                onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Actual Cost (R)"
                value={formData.actualCost}
                onChange={(e) => setFormData({ ...formData, actualCost: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {selectedJobCard ? 'Update' : 'Create'}
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
            Are you sure you want to delete this job card?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            <strong>{deleteDialog.name}</strong>
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action cannot be undone. All tasks and history associated with this job card will be lost.
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

export default JobCards;
