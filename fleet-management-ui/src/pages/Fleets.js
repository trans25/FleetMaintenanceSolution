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
  IconButton,
  Chip,
  Alert,
  Snackbar,
  MenuItem,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Edit, Delete, Refresh } from '@mui/icons-material';
import fleetService from '../services/fleetService';
import { useAuth } from '../contexts/AuthContext';

const Fleets = () => {
  const { user } = useAuth();
  const isSystemAdmin = user?.roles?.includes('SystemAdmin');
  const isTenantAdmin = user?.roles?.includes('TenantAdmin');
  const userTenantId = user?.tenantId;
  
  const [fleets, setFleets] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingFleet, setEditingFleet] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, name: '' });
  const [formData, setFormData] = useState({ tenantId: '', name: '', description: '', location: '', isActive: true });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadFleets();
  }, []);

  const loadFleets = async () => {
    try {
      setLoading(true);
      const [fleetsRes, tenantsRes, vehiclesRes] = await Promise.all([
        fleetService.getAllFleets(),
        fleetService.getAllTenants(),
        fleetService.getAllVehicles(),
      ]);
      
      // Filter fleets by tenant for TenantAdmin
      const allFleets = fleetsRes.data || [];
      const filteredFleets = isTenantAdmin 
        ? allFleets.filter(f => f.tenantId === userTenantId)
        : allFleets;
      
      setFleets(filteredFleets);
      setTenants(tenantsRes.data || []);
      setVehicles(vehiclesRes.data || []);
    } catch (error) {
      showSnackbar('Error loading fleets', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (fleet = null) => {
    const defaultTenantId = isTenantAdmin ? userTenantId : (tenants[0]?.id || '');
    
    if (fleet) {
      setEditingFleet(fleet);
      setFormData({ tenantId: fleet.tenantId || defaultTenantId, name: fleet.name, description: fleet.description, location: fleet.location || '', isActive: fleet.isActive });
    } else {
      setEditingFleet(null);
      setFormData({ tenantId: defaultTenantId, name: '', description: '', location: '', isActive: true });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingFleet(null);
    setFormData({ tenantId: '', name: '', description: '', location: '', isActive: true });
  };

  const handleSave = async () => {
    try {
      // Determine tenantId: use form value or logged-in user's tenant
      let tenantId = formData.tenantId ? parseInt(formData.tenantId) : null;
      
      // If TenantAdmin and no tenantId in form, use their tenantId
      if (isTenantAdmin && !tenantId && userTenantId) {
        tenantId = parseInt(userTenantId);
      }
      
      // Validate tenantId
      if (!tenantId || isNaN(tenantId)) {
        showSnackbar('Tenant ID is required. Please contact system administrator.', 'error');
        return;
      }

      const data = {
        ...formData,
        tenantId,
      };

      if (editingFleet) {
        await fleetService.updateFleet(editingFleet.id, { ...data, id: editingFleet.id });
        showSnackbar('Fleet updated successfully');
      } else {
        await fleetService.createFleet(data);
        showSnackbar('Fleet created successfully');
      }
      handleCloseDialog();
      loadFleets();
    } catch (error) {
      showSnackbar('Error saving fleet', 'error');
    }
  };

  const handleDeleteClick = (fleet) => {
    setDeleteDialog({ open: true, id: fleet.id, name: fleet.name });
  };

  const handleDeleteConfirm = async () => {
    try {
      await fleetService.deleteFleet(deleteDialog.id);
      showSnackbar('Fleet deleted successfully');
      loadFleets();
    } catch (error) {
      showSnackbar('Error deleting fleet', 'error');
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
    { field: 'id', headerName: 'ID', width: 70 },
    {
      field: 'tenantId',
      headerName: 'Tenant',
      width: 180,
      renderCell: (params) => {
        if (!params.row || params.value === undefined) return '';
        const tenant = tenants.find((t) => t.id === params.value);
        return tenant?.name || params.value || '';
      },
    },
    { field: 'name', headerName: 'Fleet Name', flex: 1, minWidth: 200 },
    { field: 'location', headerName: 'Location', width: 150 },
    {
      field: 'vehicleCount',
      headerName: 'Vehicles',
      width: 100,
      renderCell: (params) => {
        if (!params.row) return '0';
        const count = vehicles.filter((v) => v.fleetId === params.row.id).length;
        return count;
      },
    },
    { field: 'description', headerName: 'Description', flex: 2, minWidth: 300 },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Active' : 'Inactive'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
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
      {isTenantAdmin && !userTenantId && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">Session Error: Missing Tenant ID</Typography>
          <Typography variant="body2">
            Please log out and log back in to refresh your session.
          </Typography>
        </Alert>
      )}
      
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={600}>
          Fleets
        </Typography>
        <Box>
          <IconButton onClick={loadFleets} sx={{ mr: 1 }}>
            <Refresh />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Add Fleet
          </Button>
        </Box>
      </Box>

      <Box sx={{ height: 600, width: '100%', bgcolor: 'white', borderRadius: 1 }}>
        <DataGrid
          rows={fleets}
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
        <DialogTitle>{editingFleet ? 'Edit Fleet' : 'Add New Fleet'}</DialogTitle>
        <DialogContent>
          {user?.roles?.includes('SystemAdmin') && (
            <TextField
              select
              margin="dense"
              label="Tenant"
              fullWidth
              value={formData.tenantId}
              onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
              required
              sx={{ mb: 2 }}
            >
              {tenants.map((tenant) => (
                <MenuItem key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </MenuItem>
              ))}
            </TextField>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Fleet Name"
            fullWidth
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Location"
            fullWidth
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editingFleet ? 'Update' : 'Create'}
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
            Are you sure you want to delete this fleet?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            <strong>{deleteDialog.name}</strong>
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action cannot be undone. All vehicles in this fleet will need to be reassigned.
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

export default Fleets;
