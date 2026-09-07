import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { useAuth, ADMIN_ROLES, MANAGER_ROLES, TECHNICIAN_ROLES } from './auth/AuthContext';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import SignUpPage from './pages/auth/SignUpPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import FleetsPage from './pages/FleetsPage';
import VehiclesPage from './pages/VehiclesPage';
import VehicleDetailPage from './pages/VehicleDetailPage';
import ManufacturersPage from './pages/ManufacturersPage';
import FaultsPage from './pages/FaultsPage';
import JobCardsPage from './pages/JobCardsPage';
import ServiceSchedulesPage from './pages/ServiceSchedulesPage';
import CompliancePage from './pages/CompliancePage';
import NotificationsPage from './pages/NotificationsPage';
import ReportsPage from './pages/ReportsPage';
import AccountPage from './pages/AccountPage';
import AdministrationPage from './pages/AdministrationPage';

// Restricts a route to users holding at least one of the given roles.
function RequireRole({ roles, children }: { roles: string[]; children: ReactNode }) {
  const { hasAnyRole } = useAuth();
  return hasAnyRole(...roles) ? <>{children}</> : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Authenticated application shell */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route
          path="/fleets"
          element={
            <RequireRole roles={MANAGER_ROLES}>
              <FleetsPage />
            </RequireRole>
          }
        />
        <Route path="/vehicles" element={<VehiclesPage />} />
        <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
        <Route
          path="/manufacturers"
          element={
            <RequireRole roles={MANAGER_ROLES}>
              <ManufacturersPage />
            </RequireRole>
          }
        />
        <Route path="/faults" element={<FaultsPage />} />
        <Route
          path="/jobcards"
          element={
            <RequireRole roles={TECHNICIAN_ROLES}>
              <JobCardsPage />
            </RequireRole>
          }
        />
        <Route
          path="/service-schedules"
          element={
            <RequireRole roles={TECHNICIAN_ROLES}>
              <ServiceSchedulesPage />
            </RequireRole>
          }
        />
        <Route
          path="/compliance"
          element={
            <RequireRole roles={MANAGER_ROLES}>
              <CompliancePage />
            </RequireRole>
          }
        />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route
          path="/reports"
          element={
            <RequireRole roles={MANAGER_ROLES}>
              <ReportsPage />
            </RequireRole>
          }
        />
        <Route path="/account" element={<AccountPage />} />
        <Route
          path="/administration"
          element={
            <RequireRole roles={ADMIN_ROLES}>
              <AdministrationPage />
            </RequireRole>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
