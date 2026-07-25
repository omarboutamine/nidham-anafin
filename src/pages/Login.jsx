import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import SiteLogo from '../components/SiteLogo'
import { useLandingLang } from '../hooks/useLandingLang'
import { getSessionUser, loginWithPassword } from '../services/authStore'
import '../styles/landing-base.css'
import '../styles/landing-extra.css'

export default function Login() {
  const { t, dir } = useLandingLang()
  const navigate = useNavigate()
  const existing = getSessionUser()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (existing) return <Navigate to="/dashboard" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError(t.login.errors.required)
      return
    }
    setLoading(true)
    try {
      await loginWithPassword(email, password)
      navigate('/dashboard', { replace: true })
    } catch {
      setError(t.login.errors.invalid)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page" dir={dir}>
      <div className="login-bg">
        <div className="login-grid" />
      </div>
      <div className="login-container">
        <div className="login-card login-card--form">
          <Link to="/" className="login-logo">
            <SiteLogo />
          </Link>
          <h1 className="login-title">{t.nav.login}</h1>
          <p className="login-soon">{t.login.intro}</p>

          <form className="register-form login-form" onSubmit={handleSubmit}>
            {error && (
              <div className="register-error" role="alert">
                {error}
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
            <button type="submit" className="btn btn-primary btn-lg register-submit" disabled={loading}>
              {loading ? t.login.submitting : t.login.submit}
            </button>
          </form>

          <Link to="/" className="login-back">
            {t.login.backHome}
          </Link>
        </div>
      </div>
    </div>
  )
}
