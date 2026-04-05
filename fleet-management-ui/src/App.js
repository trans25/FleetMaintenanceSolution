import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Fleets from './pages/Fleets';
import Vehicles from './pages/Vehicles';
import Faults from './pages/Faults';
import JobCards from './pages/JobCards';
import ServiceSchedules from './pages/ServiceSchedules';

// Microsoft Fluent UI inspired theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#0078d4',
      light: '#50a7e8',
      dark: '#005a9e',
    },
    secondary: {
      main: '#2b88d8',
    },
    background: {
      default: '#f3f2f1',
      paper: '#ffffff',
    },
    text: {
      primary: '#323130',
      secondary: '#605e5c',
    },
  },
  typography: {
    fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, "Roboto", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      color: '#323130',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      color: '#323130',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      color: '#323130',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: '#323130',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: '#323130',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      color: '#323130',
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1.6px 3.6px 0 rgba(0,0,0,.132), 0 0.3px 0.9px 0 rgba(0,0,0,.108)',
          borderRadius: 4,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1.6px 3.6px 0 rgba(0,0,0,.132), 0 0.3px 0.9px 0 rgba(0,0,0,.108)',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="fleets" element={<Fleets />} />
              <Route path="vehicles" element={<Vehicles />} />
              <Route path="faults" element={<Faults />} />
              <Route path="job-cards" element={<JobCards />} />
              <Route path="service-schedules" element={<ServiceSchedules />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
