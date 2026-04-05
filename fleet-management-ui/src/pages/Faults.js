import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  Grid,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Edit, Delete, Refresh } from '@mui/icons-material';
import maintenanceService from '../services/maintenanceService';
import fleetService from '../services/fleetService';
import { useAuth } from '../contexts/AuthContext';

const Faults = () => {
  const { user } = useAuth();
  const isSystemAdmin = user?.roles?.includes('SystemAdmin');
  const isTenantAdmin = user?.roles?.includes('TenantAdmin');
  const userTenantId = user?.tenantId;
  
  const [faults, setFaults] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingFault, setEditingFault] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, name: '' });
  const [formData, setFormData] = useState({
    tenantId: '',
    vehicleId: '',
    description: '',
    severity: 'Medium',
    status: 'Open',
    reportedDate: new Date().toISOString().split('T')[0],
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [faultsRes, vehiclesRes, fleetsRes, tenantsRes] = await Promise.all([
        maintenanceService.getAllFaults(),
        fleetService.getAllVehicles(),
        fleetService.getAllFleets(),
        fleetService.getAllTenants(),
      ]);
      
      const allFleets = fleetsRes.data || [];
      const filteredFleets = isTenantAdmin 
        ? allFleets.filter(f => f.tenantId === userTenantId)
        : allFleets;
      const fleetIds = new Set(filteredFleets.map(f => f.id));
      
      const allVehicles = vehiclesRes.data || [];
      const filteredVehicles = isTenantAdmin 
        ? allVehicles.filter(v => fleetIds.has(v.fleetId))
        : allVehicles;
      const vehicleIds = new Set(filteredVehicles.map(v => v.id));
      
      const allFaults = faultsRes.data || [];
      const filteredFaults = isTenantAdmin 
        ? allFaults.filter(f => vehicleIds.has(f.vehicleId))
        : allFaults;
      
      setFaults(filteredFaults);
      setVehicles(filteredVehicles);
      setTenants(tenantsRes.data || []);
    } catch (error) {
      showSnackbar('Error loading data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (fault = null) => {
    if (fault) {
      setEditingFault(fault);
      setFormData({
        tenantId: fault.tenantId || (tenants[0]?.id || ''),
        vehicleId: fault.vehicleId,
        description: fault.description,
        severity: fault.severity,
        status: fault.status,
        reportedDate: fault.reportedDate?.split('T')[0] || '',
      });
    } else {
      setEditingFault(null);
      setFormData({
        tenantId: tenants[0]?.id || '',
        vehicleId: vehicles[0]?.id || '',
        description: '',
        severity: 'Medium',
        status: 'Open',
        reportedDate: new Date().toISOString().split('T')[0],
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingFault(null);
  };

  const handleSave = async () => {
    try {
      const data = {
        ...formData,
        tenantId: parseInt(formData.tenantId),
        reportedDate: new Date(formData.reportedDate).toISOString(),
      };

      if (editingFault) {
        await maintenanceService.updateFault(editingFault.id, { ...data, id: editingFault.id });
        showSnackbar('Fault updated successfully');
      } else {
        await maintenanceService.createFault(data);
        showSnackbar('Fault reported successfully');
      }
      handleCloseDialog();
      loadData();
    } catch (error) {
      showSnackbar('Error saving fault', 'error');
    }
  };

  const handleDeleteClick = (fault) => {
    setDeleteDialog({ open: true, id: fault.id, name: `Fault #${fault.id}` });
  };

  const handleDeleteConfirm = async () => {
    try {
      await maintenanceService.deleteFault(deleteDialog.id);
      showSnackbar('Fault deleted successfully');
      loadData();
    } catch (error) {
      showSnackbar('Error deleting fault', 'error');
    }
    setDeleteDialog({ open: false, id: null, name: '' });
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, id: null, name: '' });
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Critical': return 'error';
      case 'High': return 'warning';
      case 'Medium': return 'info';
      case 'Low': return 'default';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'error';
      case 'In Progress': return 'warning';
      case 'Resolved': return 'success';
      case 'Closed': return 'default';
      default: return 'default';
    }
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    {
      field: 'vehicleId',
      headerName: 'Vehicle',
      width: 150,
      valueGetter: (params) => {
        if (!params || !params.row) return '';
        const vehicle = vehicles.find(v => v.id === params.row.vehicleId);
        return vehicle?.registrationNumber || params.row.vehicleId || '';
      },
    },
    { field: 'description', headerName: 'Description', flex: 1, minWidth: 250 },
    {
      field: 'severity',
      headerName: 'Severity',
      width: 120,
      renderCell: (params) => (
        <Chip label={params.value} color={getSeverityColor(params.value)} size="small" />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => (
        <Chip label={params.value} color={getStatusColor(params.value)} size="small" />
      ),
    },
    {
      field: 'reportedDate',
      headerName: 'Reported',
      width: 120,
      valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString() : '',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton size="small" onClick={() => handleOpenDialog(params.row)} color="primary">
            <Edit fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => handleDeleteClick(params.row)} color="error">
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={600}>
          Faults
        </Typography>
        <Box>
          <IconButton onClick={loadData} sx={{ mr: 1 }}>
            <Refresh />
          </IconButton>
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
            Report Fault
          </Button>
        </Box>
      </Box>

      <Box sx={{ height: 600, width: '100%', bgcolor: 'white', borderRadius: 1 }}>
        <DataGrid
          rows={faults}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          disableRowSelectionOnClick
        />
      </Box>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingFault ? 'Edit Fault' : 'Report New Fault'}</DialogTitle>
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
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
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
                rows={4}
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Severity"
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                required
              >
                <MenuItem value="Low">Low</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Critical">Critical</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                required
              >
                <MenuItem value="Open">Open</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Resolved">Resolved</MenuItem>
                <MenuItem value="Closed">Closed</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="date"
                label="Reported Date"
                value={formData.reportedDate}
                onChange={(e) => setFormData({ ...formData, reportedDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editingFault ? 'Update' : 'Report'}
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
            <Delete color="error" />
            <Typography variant="h6" component="span">Confirm Delete</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to delete this fault?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            <strong>{deleteDialog.name}</strong>
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action cannot be undone. The fault record will be permanently removed.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleDeleteCancel} variant="outlined" color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error" startIcon={<Delete />}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Faults;
