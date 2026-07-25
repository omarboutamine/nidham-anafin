import { Link, Navigate } from 'react-router-dom'
import DashShell from '../components/DashShell'
import { useLandingLang } from '../hooks/useLandingLang'
import { getSessionUser } from '../services/authStore'
import { ANALYSIS_MODULES } from '../services/analysisEngine'
import '../styles/landing-base.css'
import '../styles/landing-extra.css'
import '../styles/financial.css'

export default function Dashboard() {
  const { t } = useLandingLang()
  const user = getSessionUser()
  const d = t.dashboard
  const nav = t.modules?.nav || {}
  const navDesc = t.modules?.navDesc || {}

  if (!user) return <Navigate to="/login" replace />

  return (
    <DashShell user={user} showSidebar>
      <section className="dash-home-panel">
        <p className="dash-kicker">{d.kicker}</p>
        <h1 className="dash-title">
          {d.welcome} <span>{user.fullName}</span>
        </h1>
        <p className="dash-lead">{d.homeHint}</p>
        <div className="dash-module-grid">
          {ANALYSIS_MODULES.map((mod) => (
            <Link key={mod.id} to={mod.path} className="dash-module-card">
              <strong>{nav[mod.id] || mod.id}</strong>
              <span>{navDesc[mod.id] || ''}</span>
            </Link>
          ))}
        </div>
      </section>
    </DashShell>
  )
}
