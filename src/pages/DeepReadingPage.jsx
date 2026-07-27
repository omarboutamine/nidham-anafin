import { Navigate } from 'react-router-dom'
import DashShell from '../components/DashShell'
import DeepReading from '../components/DeepReading'
import { getSessionUser } from '../services/authStore'
import '../styles/landing-base.css'
import '../styles/landing-extra.css'
import '../styles/financial.css'

export default function DeepReadingPage() {
  const user = getSessionUser()
  if (!user) return <Navigate to="/login" replace />

  return (
    <DashShell user={user} showSidebar activeSidebar="deepReading">
      <DeepReading user={user} />
    </DashShell>
  )
}
