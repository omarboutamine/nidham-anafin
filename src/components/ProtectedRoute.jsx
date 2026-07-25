import { Navigate } from 'react-router-dom'
import { getSessionUser } from '../services/authStore'

export default function ProtectedRoute({ children }) {
  const user = getSessionUser()
  if (!user) return <Navigate to="/login" replace />
  return children
}
