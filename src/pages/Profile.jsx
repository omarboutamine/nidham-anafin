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
import { applyAnafinImport, downloadAnafinExport } from '../services/dataTransfer'
import '../styles/landing-base.css'
import '../styles/landing-extra.css'
import '../styles/financial.css'

export default function Profile() {
  const { t, lang } = useLandingLang()
  const user = getSessionUser()
  const d = t.dashboard
  const x = t.dataTransfer
  const fileRef = useRef(null)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  if (!user) return <Navigate to="/login" replace />

  const handleExport = () => {
    setErr('')
    const payload = downloadAnafinExport()
    setMsg(x.exported.replace('{n}', String(Object.keys(payload.data).length)))
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setErr('')
    setMsg('')
    try {
      const text = await file.text()
      const n = applyAnafinImport(text, { clearExisting: true })
      setMsg(x.imported.replace('{n}', String(n)))
      window.setTimeout(() => window.location.assign('/dashboard'), 700)
    } catch {
      setErr(x.importFailed)
    } finally {
      e.target.value = ''
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

      {user.role === 'superadmin' ? (
        <section className="dash-panel data-transfer-panel">
          <h2 className="data-transfer-panel__title">{x.title}</h2>
          <p className="data-transfer-panel__lead">{x.lead}</p>
          <div className="data-transfer-panel__actions">
            <button type="button" className="btn btn-primary" onClick={handleExport}>
              {x.exportBtn}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
              {x.importBtn}
            </button>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={handleImport} />
          </div>
          {msg && (
            <p className="data-transfer-panel__ok" role="status">
              {msg}
            </p>
          )}
          {err && (
            <p className="data-transfer-panel__err" role="alert">
              {err}
            </p>
          )}
        </section>
      ) : null}
    </DashShell>
  )
}
