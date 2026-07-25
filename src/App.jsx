import { BrowserRouter, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import BilanPage from './pages/BilanPage'
import Dashboard from './pages/Dashboard'
import Landing from './pages/Landing'
import Login from './pages/Login'
import ProfilePage from './pages/ProfilePage'
import ScfPage from './pages/ScfPage'
import TcrPage from './pages/TcrPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
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
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/scf"
          element={
            <ProtectedRoute>
              <ScfPage />
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
      </Routes>
    </BrowserRouter>
  )
}
