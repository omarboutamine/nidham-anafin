import { Link, Navigate, useNavigate } from 'react-router-dom'
import SiteLogo from '../components/SiteLogo'
import {
  academicYearLabel,
  professionLabel,
  PROFESSION_VALUES,
} from '../config/registerOptions'
import { useLandingLang } from '../hooks/useLandingLang'
import { getSessionUser, logout } from '../services/authStore'
import '../styles/landing-base.css'
import '../styles/landing-extra.css'

export default function Dashboard() {
  const { t, dir, lang } = useLandingLang()
  const navigate = useNavigate()
  const user = getSessionUser()
  const d = t.dashboard

  if (!user) return <Navigate to="/login" replace />

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="dash-page" dir={dir}>
      <header className="dash-header">
        <Link to="/dashboard" className="dash-logo">
          <SiteLogo />
        </Link>
        <div className="dash-header-actions">
          <span className="dash-user-chip">{user.fullName}</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout}>
            {d.logout}
          </button>
        </div>
      </header>

      <main className="dash-main">
        <section className="dash-hero">
          <p className="dash-kicker">{d.kicker}</p>
          <h1 className="dash-title">
            {d.welcome} <span>{user.fullName}</span>
          </h1>
          <p className="dash-lead">{d.lead}</p>
        </section>

        <section className="dash-panel">
          <h2 className="dash-panel-title">{d.profileTitle}</h2>
          <dl className="dash-profile-grid">
            <div>
              <dt>{t.register.email}</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>{t.register.phone}</dt>
              <dd>{user.phone}</dd>
            </div>
            <div>
              <dt>{t.register.birthDate}</dt>
              <dd>{user.birthDate}</dd>
            </div>
            <div>
              <dt>{t.register.birthPlace}</dt>
              <dd>{user.birthPlace}</dd>
            </div>
            <div>
              <dt>{t.register.registrationNumber}</dt>
              <dd>{user.registrationNumber}</dd>
            </div>
            <div>
              <dt>{t.register.profession}</dt>
              <dd>{professionLabel(user.profession, t)}</dd>
            </div>
            {user.profession === PROFESSION_VALUES.STUDENT && (
              <div>
                <dt>{t.register.academicYear}</dt>
                <dd>{academicYearLabel(user.academicYear, lang)}</dd>
              </div>
            )}
          </dl>
        </section>

        <section className="dash-panel dash-panel--muted">
          <h2 className="dash-panel-title">{d.workspaceTitle}</h2>
          <p className="dash-workspace-empty">{d.workspaceEmpty}</p>
        </section>
      </main>
    </div>
  )
}
