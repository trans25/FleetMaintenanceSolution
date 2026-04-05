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
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Edit, Delete, Refresh, Warning } from '@mui/icons-material';
import fleetService from '../services/fleetService';
import { useAuth } from '../contexts/AuthContext';

const Tenants = () => {
  const { user } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, name: '' });
  const [formData, setFormData] = useState({
    name: '',
    contactEmail: '',
    contactPhone: '',
    isActive: true,
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const response = await fleetService.getAllTenants();
      setTenants(response.data || []);
    } catch (error) {
      showSnackbar('Error loading tenants', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Check if user is System Admin
  if (!user?.roles?.includes('SystemAdmin')) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          You do not have permission to view this page. Tenant management is only available to System Administrators.
        </Alert>
      </Box>
    );
  }

  const handleOpenDialog = (tenant = null) => {
    if (tenant) {
      setEditingTenant(tenant);
      setFormData({
        name: tenant.name,
        contactEmail: tenant.contactEmail,
        contactPhone: tenant.contactPhone || '',
        isActive: tenant.isActive,
      });
    } else {
      setEditingTenant(null);
      setFormData({
        name: '',
        contactEmail: '',
        contactPhone: '',
        isActive: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTenant(null);
    setFormData({
      name: '',
      contactEmail: '',
      contactPhone: '',
      isActive: true,
    });
  };

  const handleInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSave = async () => {
    try {
      if (editingTenant) {
        await fleetService.updateTenant(editingTenant.id, { ...formData, id: editingTenant.id });
        showSnackbar('Tenant updated successfully');
      } else {
        await fleetService.createTenant(formData);
        showSnackbar('Tenant created successfully');
      }
      handleCloseDialog();
      loadTenants();
    } catch (error) {
      const errorMessage = error.response?.data?.title || 
                          error.response?.data?.message || 
                          error.message || 
                          'Error saving tenant';
      showSnackbar(typeof errorMessage === 'string' ? errorMessage : 'Error saving tenant', 'error');
    }
  };

  const handleDeleteClick = (tenant) => {
    setDeleteDialog({ open: true, id: tenant.id, name: tenant.name });
  };

  const handleDeleteConfirm = async () => {
    try {
      await fleetService.deleteTenant(deleteDialog.id);
      showSnackbar('Tenant deleted successfully');
      setDeleteDialog({ open: false, id: null, name: '' });
      loadTenants();
    } catch (error) {
      const errorMessage = error.response?.data?.title || 
                          error.response?.data?.message || 
                          error.message || 
                          'Error deleting tenant';
      showSnackbar(typeof errorMessage === 'string' ? errorMessage : 'Error deleting tenant', 'error');
      setDeleteDialog({ open: false, id: null, name: '' });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, id: null, name: '' });
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Tenant Name', flex: 1, minWidth: 200 },
    { field: 'contactEmail', headerName: 'Contact Email', flex: 1, minWidth: 200 },
    { field: 'contactPhone', headerName: 'Contact Phone', width: 150 },
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
      renderCell: (params) => (
        <>
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleOpenDialog(params.row)}
          >
            <Edit />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDeleteClick(params.row)}
          >
            <Delete />
          </IconButton>
        </>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Tenant Management
        </Typography>
        <Box>
          <IconButton onClick={loadTenants} sx={{ mr: 1 }}>
            <Refresh />
          </IconButton>
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
            Add New Tenant
          </Button>
        </Box>
      </Box>

      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={tenants}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableSelectionOnClick
          loading={loading}
        />
      </Box>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTenant ? 'Edit Tenant' : 'Add New Tenant'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Tenant Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              fullWidth
            />
            <TextField
              label="Contact Email"
              name="contactEmail"
              type="email"
              value={formData.contactEmail}
              onChange={handleInputChange}
              required
              fullWidth
            />
            <TextField
              label="Contact Phone"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleInputChange}
              fullWidth
            />
            <FormControlLabel
              control={
                <Checkbox
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editingTenant ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="error" />
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete tenant <strong>{deleteDialog.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
export default Tenants;
