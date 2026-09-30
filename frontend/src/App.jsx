import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoadingSpinner from './components/common/LoadingSpinner';

// --- AUTH PAGES ---
import LandingPage from './pages/auth/LandingPage';
import LoginPage   from './pages/auth/LoginPage';

// --- RECEPTIONIST PAGES ---
import ReceptionistDashboard from './pages/receptionist/Dashboard';
import AppointmentsPage      from './pages/receptionist/Appointments';
import PatientsPage          from './pages/receptionist/Patients';
import ReceptionistReports   from './pages/receptionist/Reports';

// --- PHARMACEUTICAL PAGES ---
import PharmaDashboard from './pages/pharmaceutical/Dashboard';
import MedicinesPage   from './pages/pharmaceutical/Medicines';
import SellPage        from './pages/pharmaceutical/Sell';
import StockPage       from './pages/pharmaceutical/Stock';
import PharmaReports   from './pages/pharmaceutical/Reports';

// --- ADMIN PAGES ---
import AdminProfile          from './pages/admin/AdminProfile';
import AdminSettings         from './pages/admin/Settings';
import BranchManagement      from './pages/admin/BranchManagement';
import ClinicStaffManagement from './pages/admin/ClinicStaffManagement';
import ClinicDashboard       from './pages/admin/ClinicDashboard';
import ClinicReports         from './pages/admin/ClinicReports';
import AdminMedicineStock    from './pages/admin/MedicineStock';

function App() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      {/* ── PUBLIC ──────────────────────────────────────────────────────── */}
      <Route
        path="/"
        element={isAuthenticated ? <Navigate to={`/${user.role}/dashboard`} /> : <LandingPage />}
      />
      <Route
        path="/login/:role"
        element={isAuthenticated ? <Navigate to={`/${user.role}/dashboard`} /> : <LoginPage />}
      />

      {/* ── RECEPTIONIST ────────────────────────────────────────────────── */}
      <Route
        path="/receptionist"
        element={
          <ProtectedRoute allowedRoles={['receptionist']}>
            <MainLayout role="receptionist" />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard"    element={<ReceptionistDashboard />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="patients"     element={<PatientsPage />} />
        <Route path="reports"      element={<ReceptionistReports />} />
      </Route>

      {/* ── PHARMACEUTICAL ──────────────────────────────────────────────── */}
      <Route
        path="/pharmaceutical"
        element={
          <ProtectedRoute allowedRoles={['pharmaceutical']}>
            <MainLayout role="pharmaceutical" />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<PharmaDashboard />} />
        <Route path="sell"      element={<SellPage />} />
        <Route path="medicines" element={<MedicinesPage />} />
        <Route path="stock"     element={<StockPage />} />
        <Route path="reports"   element={<PharmaReports />} />
      </Route>

      {/* ── ADMIN ───────────────────────────────────────────────────────── */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout role="admin" />
          </ProtectedRoute>
        }
      >
        {/* /admin/dashboard → redirect straight to clinic overview */}
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"      element={<ClinicDashboard />} />
        <Route path="branches"       element={<BranchManagement />} />
        <Route path="clinic-staff"   element={<ClinicStaffManagement />} />
        <Route path="clinic-reports" element={<ClinicReports />} />
        <Route path="medicine-stock" element={<AdminMedicineStock />} />
        <Route path="settings"       element={<AdminSettings />} />
        <Route path="profile"        element={<AdminProfile />} />
      </Route>

      {/* ── CATCH-ALL ───────────────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
