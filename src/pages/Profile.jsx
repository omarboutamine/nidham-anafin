import { useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import DashShell from '../components/DashShell'
import {
  academicYearLabel,
  professionLabel,
  PROFESSION_VALUES,
} from '../config/registerOptions'
import { useLandingLang } from '../hooks/useLandingLang'
import { getSessionUser } from '../services/authStore'
import { downloadAnafinBackup, importAnafinBackup } from '../services/dataBackup'
import '../styles/landing-base.css'
import '../styles/landing-extra.css'
import '../styles/financial.css'

export default function Profile() {
  const { t, lang } = useLandingLang()
  const user = getSessionUser()
  const d = t.dashboard
  const b = t.backup
  const fileRef = useRef(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  if (!user) return <Navigate to="/login" replace />

  const handleExport = () => {
    setError('')
    downloadAnafinBackup()
    setMessage(b.exported)
  }

  const handleImportClick = () => fileRef.current?.click()

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError('')
    setMessage('')
    try {
      const text = await file.text()
      importAnafinBackup(text)
      setMessage(b.imported)
      window.setTimeout(() => {
        window.location.assign('/dashboard')
      }, 700)
    } catch {
      setError(b.importFailed)
    }
  }

  return (
    <DashShell user={user}>
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

      <section className="dash-panel backup-panel">
        <h2 className="backup-panel__title">{b.title}</h2>
        <p className="backup-panel__lead">{b.lead}</p>
        <div className="backup-panel__actions">
          <button type="button" className="btn btn-primary" onClick={handleExport}>
            {b.exportBtn}
          </button>
          <button type="button" className="btn btn-ghost" onClick={handleImportClick}>
            {b.importBtn}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="backup-panel__file"
            onChange={handleImportFile}
          />
        </div>
        {message && (
          <p className="backup-panel__ok" role="status">
            {message}
          </p>
        )}
        {error && (
          <p className="backup-panel__err" role="alert">
            {error}
          </p>
        )}
      </section>
    </DashShell>
  )
}
