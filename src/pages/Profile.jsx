import { Navigate } from 'react-router-dom'
import DashShell from '../components/DashShell'
import {
  academicYearLabel,
  professionLabel,
  PROFESSION_VALUES,
} from '../config/registerOptions'
import { useLandingLang } from '../hooks/useLandingLang'
import { getSessionUser } from '../services/authStore'
import '../styles/landing-base.css'
import '../styles/landing-extra.css'
import '../styles/financial.css'

export default function Profile() {
  const { t, lang } = useLandingLang()
  const user = getSessionUser()
  const d = t.dashboard

  if (!user) return <Navigate to="/login" replace />

  return (
    <DashShell user={user} activeNav={null}>
      <section className="dash-hero">
        <p className="dash-kicker">{d.personalData}</p>
        <h1 className="dash-title">{d.profileTitle}</h1>
      </section>

      <section className="dash-panel">
        <dl className="dash-profile-grid">
          <div>
            <dt>{t.register.fullName}</dt>
            <dd>{user.fullName}</dd>
          </div>
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
    </DashShell>
  )
}
