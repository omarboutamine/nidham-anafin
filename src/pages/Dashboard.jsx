import { Navigate } from 'react-router-dom'
import DashboardShell from '../components/DashboardShell'
import { useLandingLang } from '../hooks/useLandingLang'
import { getSessionUser } from '../services/authStore'
import '../styles/landing-base.css'
import '../styles/landing-extra.css'
import '../styles/dashboard-app.css'

export default function Dashboard() {
  const { t } = useLandingLang()
  const user = getSessionUser()
  const d = t.dashboard

  if (!user) return <Navigate to="/login" replace />

  return (
    <DashboardShell>
      <section className="dash-hero">
        <p className="dash-kicker">{d.kicker}</p>
        <h1 className="dash-title">
          {d.welcome} <span>{user.fullName}</span>
        </h1>
        <p className="dash-lead">{d.lead}</p>
      </section>
      <section className="dash-panel dash-panel--muted">
        <p className="dash-workspace-empty">{d.homeHint}</p>
      </section>
    </DashboardShell>
  )
}
