import { Link, Navigate } from 'react-router-dom'
import DashShell from '../components/DashShell'
import { useLandingLang } from '../hooks/useLandingLang'
import { getSessionUser } from '../services/authStore'
import '../styles/landing-base.css'
import '../styles/landing-extra.css'
import '../styles/financial.css'

export default function Dashboard() {
  const { t } = useLandingLang()
  const user = getSessionUser()
  const d = t.dashboard

  if (!user) return <Navigate to="/login" replace />

  return (
    <DashShell user={user} activeNav="home">
      <section className="dash-hero">
        <p className="dash-kicker">{d.kicker}</p>
        <h1 className="dash-title">
          {d.welcome} <span>{user.fullName}</span>
        </h1>
        <p className="dash-lead">{d.lead}</p>
      </section>

      <section className="dash-tools">
        <h2 className="dash-panel-title">{d.statementsTitle}</h2>
        <p className="dash-lead dash-lead--tight">{d.statementsLead}</p>
        <div className="dash-tool-grid">
          <Link to="/dashboard/bilan" className="dash-tool-card">
            <span className="dash-tool-card__tag">SCF</span>
            <strong className="dash-tool-card__title">Bilan</strong>
            <span className="dash-tool-card__desc">{d.bilanCard}</span>
          </Link>
          <Link to="/dashboard/tcr" className="dash-tool-card">
            <span className="dash-tool-card__tag">SCF</span>
            <strong className="dash-tool-card__title">TCR</strong>
            <span className="dash-tool-card__desc">{d.tcrCard}</span>
          </Link>
        </div>
      </section>
    </DashShell>
  )
}
