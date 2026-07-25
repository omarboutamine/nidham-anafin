import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AdminUsersPage from './pages/AdminUsersPage'
import BilanPage from './pages/BilanPage'
import Dashboard from './pages/Dashboard'
import ForgotPassword from './pages/ForgotPassword'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Profile from './pages/Profile'
import StructureAnalysisPage from './pages/StructureAnalysisPage'
import TcrPage from './pages/TcrPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/bilan"
          element={
            <ProtectedRoute>
              <BilanPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/tcr"
          element={
            <ProtectedRoute>
              <TcrPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/analyse-structure"
          element={
            <ProtectedRoute>
              <StructureAnalysisPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/users"
          element={
            <ProtectedRoute>
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
        <Route path="/dashboard/scf" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
