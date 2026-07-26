import { useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import SiteLogo from '../components/SiteLogo'
import { useLandingLang } from '../hooks/useLandingLang'
import { getSessionUser, loginWithPassword } from '../services/authStore'
import { importAnafinBackup } from '../services/dataBackup'
import '../styles/landing-base.css'
import '../styles/landing-extra.css'
import '../styles/financial.css'

export default function Login() {
  const { t, dir, lang, setLang } = useLandingLang()
  const navigate = useNavigate()
  const existing = getSessionUser()
  const fileRef = useRef(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  if (existing) return <Navigate to="/dashboard" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    if (!email.trim() || !password) {
      setError(t.login.errors.required)
      return
    }
    setLoading(true)
    try {
      await loginWithPassword(email, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      if (err?.message === 'ACCOUNT_DISABLED') setError(t.login.errors.disabled)
      else setError(t.login.errors.invalid)
    } finally {
      setLoading(false)
    }
  }

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError('')
    setInfo('')
    try {
      const text = await file.text()
      importAnafinBackup(text)
      setInfo(t.backup.imported)
      window.setTimeout(() => {
        window.location.assign('/dashboard')
      }, 500)
    } catch {
      setError(t.backup.importFailed)
    }
  }

  return (
    <div className="login-page" dir={dir}>
      <div className="login-bg">
        <div className="login-grid" />
      </div>
      <div className="login-container">
        <div className="login-card login-card--form">
          <div className="login-top-bar">
            <Link to="/" className="login-logo">
              <SiteLogo />
            </Link>
            <div className="landing-lang-switch" role="group" aria-label={t.langSwitchLabel}>
              <button
                type="button"
                className={`landing-lang-btn ${lang === 'ar' ? 'active' : ''}`}
                onClick={() => setLang('ar')}
              >
                العربية
              </button>
              <button
                type="button"
                className={`landing-lang-btn ${lang === 'fr' ? 'active' : ''}`}
                onClick={() => setLang('fr')}
              >
                Français
              </button>
            </div>
          </div>

          <h1 className="login-title">{t.nav.login}</h1>
          <p className="login-soon">{t.login.intro}</p>

          <form className="register-form login-form" onSubmit={handleSubmit}>
            {error && (
              <div className="register-error" role="alert">
                {error}
              </div>
            )}
            {info && (
              <div className="register-success" role="status">
                {info}
              </div>
            )}
            <label className="register-label">
              {t.register.email}
              <input
                className="register-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
              />
            </label>
            <label className="register-label">
              {t.register.password}
              <input
                className="register-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            <div className="login-forgot-row">
              <Link to="/forgot-password" className="login-forgot">
                {t.login.forgot}
              </Link>
            </div>
            <button type="submit" className="btn btn-primary btn-lg register-submit" disabled={loading}>
              {loading ? t.login.submitting : t.login.submit}
            </button>
          </form>

          <div className="login-backup">
            <p className="login-backup__lead">{t.backup.loginHint}</p>
            <button type="button" className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
              {t.backup.importBtn}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="backup-panel__file"
              onChange={handleImportFile}
            />
          </div>

          <Link to="/" className="login-back">
            {t.login.backHome}
          </Link>
        </div>
      </div>
    </div>
  )
}
