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
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  OutlinedInput,
  Grid,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Edit, Delete, Refresh, Warning } from '@mui/icons-material';
import fleetService from '../services/fleetService';
import { useAuth } from '../contexts/AuthContext';

const Users = () => {
  const { user } = useAuth();
  const isSystemAdmin = user?.roles?.includes('SystemAdmin');
  const isTenantAdmin = user?.roles?.includes('TenantAdmin');
  const userTenantId = user?.tenantId;
  
  // Show warning if TenantAdmin doesn't have tenantId set
  React.useEffect(() => {
    if (isTenantAdmin && !userTenantId) {
      console.warn('WARNING: TenantAdmin user does not have tenantId set. Please update user in database.');
    }
  }, [isTenantAdmin, userTenantId]);
  
  const [users, setUsers] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, name: '' });
  const [formData, setFormData] = useState({
    tenantId: '',
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    isActive: true,
    roleIds: [],
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, tenantsRes, rolesRes] = await Promise.all([
        fleetService.getAllUsers(),
        fleetService.getAllTenants(),
        fleetService.getAllRoles(),
      ]);
      
      // Filter users by tenant for TenantAdmin
      const allUsers = usersRes.data || [];
      const filteredUsers = isTenantAdmin 
        ? allUsers.filter(u => u.tenantId === userTenantId)
        : allUsers;
      
      setUsers(filteredUsers);
      setTenants(tenantsRes.data || []);
      setRoles(rolesRes.data || []);
    } catch (error) {
      showSnackbar('Error loading data', 'error');
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

  const handleOpenDialog = (userToEdit = null) => {
    // Determine default tenant ID with proper fallback
    let defaultTenantId = '';
    if (isTenantAdmin && userTenantId) {
      defaultTenantId = userTenantId;
    } else if (tenants && tenants.length > 0) {
      defaultTenantId = tenants[0].id;
    }
    
    // Debug logging
    console.log('User context:', { user, isTenantAdmin, userTenantId, defaultTenantId, tenantsCount: tenants.length });
    
    if (userToEdit) {
      setEditingUser(userToEdit);
      setFormData({
        tenantId: userToEdit.tenantId || defaultTenantId,
        username: userToEdit.username,
        email: userToEdit.email,
        password: '', // Don't populate password for edit
        firstName: userToEdit.firstName || '',
        lastName: userToEdit.lastName || '',
        isActive: userToEdit.isActive,
        roleIds: userToEdit.roles?.map(r => r.id) || [],
      });
    } else {
      setEditingUser(null);
      setFormData({
        tenantId: defaultTenantId,
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        isActive: true,
        roleIds: [],
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setFormData({
      tenantId: '',
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      isActive: true,
      roleIds: [],
    });
  };

  const handleInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleRoleChange = (event) => {
    setFormData({
      ...formData,
      roleIds: event.target.value,
    });
  };

  const handleSave = async () => {
    try {
      // Determine tenantId: use form value, or logged-in user's tenant, or fail
      let tenantId = formData.tenantId ? parseInt(formData.tenantId) : null;
      
      // If TenantAdmin and no tenantId in form, use their tenantId
      if (isTenantAdmin && !tenantId && userTenantId) {
        tenantId = parseInt(userTenantId);
      }
      
      // Validate tenantId
      if (!tenantId || isNaN(tenantId)) {
        showSnackbar('Tenant ID is required. Please contact system administrator to update your user profile.', 'error');
        console.error('Invalid tenantId:', { formData, userTenantId, isTenantAdmin });
        return;
      }

      const data = {
        ...formData,
        tenantId,
        roleIds: formData.roleIds.map(id => parseInt(id)),
      };

      if (editingUser) {
        await fleetService.updateUser(editingUser.id, { ...data, id: editingUser.id });
        showSnackbar('User updated successfully');
      } else {
        await fleetService.createUser(data);
        showSnackbar('User created successfully');
      }
      handleCloseDialog();
      loadData();
    } catch (error) {
      const errorMessage = error.response?.data?.title || 
                          error.response?.data?.message || 
                          error.response?.data || 
                          error.message || 
                          'Error saving user';
      showSnackbar(typeof errorMessage === 'string' ? errorMessage : 'Error saving user', 'error');
    }
  };

  const handleDeleteClick = (userToDelete) => {
    setDeleteDialog({ open: true, id: userToDelete.id, name: `${userToDelete.firstName} ${userToDelete.lastName}` });
  };

  const handleDeleteConfirm = async () => {
    try {
      await fleetService.deleteUser(deleteDialog.id);
      showSnackbar('User deleted successfully');
      setDeleteDialog({ open: false, id: null, name: '' });
      loadData();
    } catch (error) {
      const errorMessage = error.response?.data?.title || 
                          error.response?.data?.message || 
                          error.message || 
                          'Error deleting user';
      showSnackbar(typeof errorMessage === 'string' ? errorMessage : 'Error deleting user', 'error');
      setDeleteDialog({ open: false, id: null, name: '' });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, id: null, name: '' });
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'username', headerName: 'Username', width: 150 },
    {
      field: 'fullName',
      headerName: 'Full Name',
      width: 200,
      valueGetter: (params) => {
        if (!params || !params.row) return 'N/A';
        return `${params.row.firstName || ''} ${params.row.lastName || ''}`.trim() || 'N/A';
      },
    },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 200 },
    {
      field: 'tenantId',
      headerName: 'Tenant',
      width: 180,
      valueGetter: (params) => {
        if (!params || !params.row) return 'Unknown';
        const tenant = tenants.find((t) => t.id === params.row.tenantId);
        return tenant ? tenant.name : 'Unknown';
      },
    },
    {
      field: 'roles',
      headerName: 'Roles',
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {params.value?.map((role, idx) => (
            <Chip key={idx} label={role.name} size="small" color="primary" variant="outlined" />
          )) || 'No roles'}
        </Box>
      ),
    },
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
            disabled={!user?.roles?.includes('SystemAdmin')}
          >
            <Delete />
          </IconButton>
        </>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {isTenantAdmin && !userTenantId && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">Session Error: Missing Tenant ID</Typography>
          <Typography variant="body2">
            Your account doesn't have a tenant ID in the current session. Please log out and log back in to refresh your session.
            If the problem persists, contact your system administrator.
          </Typography>
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          User Management
        </Typography>
        <Box>
          <IconButton onClick={loadData} sx={{ mr: 1 }}>
            <Refresh />
          </IconButton>
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
            Add New User
          </Button>
        </Box>
      </Box>

      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={users}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableSelectionOnClick
          loading={loading}
        />
      </Box>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {user?.roles?.includes('SystemAdmin') && (
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Tenant"
                  name="tenantId"
                  value={formData.tenantId}
                  onChange={handleInputChange}
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
            <Grid item xs={12} sm={6}>
              <TextField
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label={editingUser ? 'Password (leave blank to keep current)' : 'Password'}
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required={!editingUser}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Roles</InputLabel>
                <Select
                  multiple
                  value={formData.roleIds}
                  onChange={handleRoleChange}
                  input={<OutlinedInput label="Roles" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const role = roles.find(r => r.id === value);
                        return <Chip key={value} label={role?.name || value} size="small" />;
                      })}
                    </Box>
                  )}
                >
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
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
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editingUser ? 'Update' : 'Create'}
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
            Are you sure you want to delete user <strong>{deleteDialog.name}</strong>? This action cannot be undone.
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

export default Users;
