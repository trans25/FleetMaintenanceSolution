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
import fleetService from '../services/fleetService';
import { useAuth } from '../contexts/AuthContext';

const Vehicles = () => {
  const { user } = useAuth();
  const isSystemAdmin = user?.roles?.includes('SystemAdmin');
  const isTenantAdmin = user?.roles?.includes('TenantAdmin');
  const userTenantId = user?.tenantId;
  
  const [vehicles, setVehicles] = useState([]);
  const [fleets, setFleets] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, name: '' });
  const [formData, setFormData] = useState({
    tenantId: '',
    fleetId: '',
    manufacturerId: 1,
    registrationNumber: '',
    vin: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    mileage: 0,
    status: 'Active',
    purchaseDate: new Date().toISOString().split('T')[0],
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [vehiclesRes, fleetsRes, tenantsRes] = await Promise.all([
        fleetService.getAllVehicles(),
        fleetService.getAllFleets(),
        fleetService.getAllTenants(),
      ]);
      
      const allVehicles = vehiclesRes.data || [];
      const allFleets = fleetsRes.data || [];
      
      // Filter fleets and vehicles by tenant for TenantAdmin
      const filteredFleets = isTenantAdmin 
        ? allFleets.filter(f => f.tenantId === userTenantId)
        : allFleets;
      
      const filteredFleetIds = new Set(filteredFleets.map(f => f.id));
      const filteredVehicles = isTenantAdmin 
        ? allVehicles.filter(v => filteredFleetIds.has(v.fleetId))
        : allVehicles;
      
      setVehicles(filteredVehicles);
      setFleets(filteredFleets);
      setTenants(tenantsRes.data || []);
    } catch (error) {
      showSnackbar('Error loading data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (vehicle = null) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setFormData({
        tenantId: vehicle.tenantId || (tenants[0]?.id || ''),
        fleetId: vehicle.fleetId,
        manufacturerId: vehicle.manufacturerId || 1,
        registrationNumber: vehicle.registrationNumber,
        vin: vehicle.vin || '',
        model: vehicle.model,
        year: vehicle.year,
        color: vehicle.color || '',
        mileage: vehicle.mileage || 0,
        status: vehicle.status,
        purchaseDate: vehicle.purchaseDate?.split('T')[0] || '',
      });
    } else {
      setEditingVehicle(null);
      setFormData({
        tenantId: tenants[0]?.id || '',
        fleetId: fleets[0]?.id || '',
        manufacturerId: 1,
        registrationNumber: '',
        vin: '',
        model: '',
        year: new Date().getFullYear(),
        color: '',
        mileage: 0,
        status: 'Active',
        purchaseDate: new Date().toISOString().split('T')[0],
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingVehicle(null);
  };

  const handleSave = async () => {
    try {
      const data = {
        ...formData,
        tenantId: parseInt(formData.tenantId),
        fleetId: parseInt(formData.fleetId),
        purchaseDate: new Date(formData.purchaseDate).toISOString(),
      };

      if (editingVehicle) {
        await fleetService.updateVehicle(editingVehicle.id, { ...data, id: editingVehicle.id });
        showSnackbar('Vehicle updated successfully');
      } else {
        await fleetService.createVehicle(data);
        showSnackbar('Vehicle created successfully');
      }
      handleCloseDialog();
      loadData();
    } catch (error) {
      showSnackbar('Error saving vehicle', 'error');
    }
  };

  const handleDeleteClick = (vehicle) => {
    setDeleteDialog({ open: true, id: vehicle.id, name: vehicle.registrationNumber });
  };

  const handleDeleteConfirm = async () => {
    try {
      await fleetService.deleteVehicle(deleteDialog.id);
      showSnackbar('Vehicle deleted successfully');
      loadData();
    } catch (error) {
      showSnackbar('Error deleting vehicle', 'error');
    }
    setDeleteDialog({ open: false, id: null, name: '' });
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, id: null, name: '' });
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Maintenance': return 'warning';
      case 'Inactive': return 'error';
      default: return 'default';
    }
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'registrationNumber', headerName: 'Registration', width: 150 },
    {
      field: 'tenantId',
      headerName: 'Tenant',
      width: 150,
      renderCell: (params) => {
        if (!params.row || params.value === undefined) return '';
        const fleet = fleets.find((f) => f.id === params.row.fleetId);
        const tenant = tenants.find((t) => t.id === fleet?.tenantId);
        return tenant?.name || params.value || '';
      },
    },
    {
      field: 'fleetId',
      headerName: 'Fleet',
      width: 150,
      renderCell: (params) => {
        if (!params.row || params.value === undefined) return '';
        const fleet = fleets.find((f) => f.id === params.value);
        return fleet?.name || params.value || '';
      },
    },
    { field: 'model', headerName: 'Model', flex: 1, minWidth: 180 },
    { field: 'year', headerName: 'Year', width: 90 },
    { field: 'color', headerName: 'Color', width: 120 },
    { field: 'mileage', headerName: 'Mileage', width: 120, valueFormatter: (params) => params?.value?.toLocaleString() || 0 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip label={params.value} color={getStatusColor(params.value)} size="small" />
      ),
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
          Vehicles
        </Typography>
        <Box>
          <IconButton onClick={loadData} sx={{ mr: 1 }}>
            <Refresh />
          </IconButton>
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
            Add Vehicle
          </Button>
        </Box>
      </Box>

      <Box sx={{ height: 600, width: '100%', bgcolor: 'white', borderRadius: 1 }}>
        <DataGrid
          rows={vehicles}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          disableRowSelectionOnClick
        />
      </Box>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {user?.roles?.includes('SystemAdmin') && (
              <Grid item xs={12} sm={6}>
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
            <Grid item xs={12} sm={user?.roles?.includes('SystemAdmin') ? 6 : 12}>
              <TextField
                select
                fullWidth
                label="Fleet"
                value={formData.fleetId}
                onChange={(e) => setFormData({ ...formData, fleetId: e.target.value })}
                required
              >
                {fleets.map((fleet) => (
                  <MenuItem key={fleet.id} value={fleet.id}>
                    {fleet.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Registration Number"
                value={formData.registrationNumber}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="VIN"
                value={formData.vin}
                onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Year"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Mileage"
                value={formData.mileage}
                onChange={(e) => setFormData({ ...formData, mileage: parseFloat(e.target.value) })}
              />
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
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Maintenance">Maintenance</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Purchase Date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editingVehicle ? 'Update' : 'Create'}
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
            Are you sure you want to delete this vehicle?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            <strong>{deleteDialog.name}</strong>
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action cannot be undone. All associated data will be permanently removed.
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

export default Vehicles;
