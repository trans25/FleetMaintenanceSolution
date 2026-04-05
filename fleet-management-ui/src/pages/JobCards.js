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
import { maintenanceApi, fleetApi } from '../services/api';
import { format } from 'date-fns';

const JobCards = () => {
  const [jobCards, setJobCards] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedJobCard, setSelectedJobCard] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [formData, setFormData] = useState({
    jobNumber: '',
    vehicleId: '',
    description: '',
    status: 'Open',
    priority: 'Medium',
    assignedUserId: 1,
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
  }, []);

  const fetchJobCards = async () => {
    try {
      setLoading(true);
      const response = await maintenanceApi.get('/JobCard');
      setJobCards(response.data);
    } catch (error) {
      showSnackbar('Failed to fetch job cards', 'error');
      console.error('Error fetching job cards:', error);
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

  const handleOpenDialog = (jobCard = null) => {
    if (jobCard) {
      setSelectedJobCard(jobCard);
      setFormData({
        jobNumber: jobCard.jobNumber,
        vehicleId: jobCard.vehicleId,
        description: jobCard.description,
        status: jobCard.status,
        priority: jobCard.priority,
 assignedUserId: jobCard.assignedUserId || 1,
        estimatedCost: jobCard.estimatedCost || 0,
        actualCost: jobCard.actualCost || 0,
      });
    } else {
      setSelectedJobCard(null);
      setFormData({
        jobNumber: `JC-${Date.now()}`,
        vehicleId: '',
        description: '',
        status: 'Open',
        priority: 'Medium',
        assignedUserId: 1,
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
        vehicleId: parseInt(formData.vehicleId),
        assignedUserId: parseInt(formData.assignedUserId),
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

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this job card?')) {
      try {
        await maintenanceApi.delete(`/JobCard/${id}`);
        showSnackbar('Job card deleted successfully');
        fetchJobCards();
      } catch (error) {
        showSnackbar('Failed to delete job card', 'error');
        console.error('Error deleting job card:', error);
      }
    }
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
        const vehicle = vehicles.find((v) => v.id === params.value);
        return vehicle?.registrationNumber || params.value;
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
