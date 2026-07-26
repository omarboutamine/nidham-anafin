import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import SiteLogo from '../components/SiteLogo'
import { useLandingLang } from '../hooks/useLandingLang'
import {
  findUserByEmail,
  getSessionUser,
  resetPasswordForEmail,
} from '../services/authStore'
import {
  clearPendingOtp,
  createAndSendOtp,
  getOtpTtlMs,
  readPendingOtp,
  verifyOtp,
} from '../services/otpService'
import '../styles/landing-base.css'
import '../styles/landing-extra.css'
import '../styles/financial.css'

export default function ForgotPassword() {
  const { t, dir, lang, setLang } = useLandingLang()
  const navigate = useNavigate()
  const f = t.forgot
  const existing = getSessionUser()

  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [expiresAt, setExpiresAt] = useState(0)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (step !== 'otp' || !expiresAt) return undefined
    const id = window.setInterval(() => setNow(Date.now()), 500)
    return () => window.clearInterval(id)
  }, [step, expiresAt])

  const remainingSec = useMemo(() => {
    if (!expiresAt) return 0
    return Math.max(0, Math.ceil((expiresAt - now) / 1000))
  }, [expiresAt, now])

  if (existing) return <Navigate to="/dashboard" replace />

  const sendCode = async (e) => {
    e.preventDefault()
    setError('')
    const user = findUserByEmail(email)
    if (!user) {
      setError(f.errors.notFound)
      return
    }
    if (user.active === false) {
      setError(f.errors.disabled)
      return
    }
    setLoading(true)
    try {
      const result = await createAndSendOtp({
        email: email.trim().toLowerCase(),
        lang,
        purpose: 'reset',
      })
      if (!result.ok) {
        setError(
          result.reason === 'ACTIVATION_REQUIRED'
            ? t.register.errors.activationRequired
            : t.register.errors.sendFailed,
        )
        return
      }
      setExpiresAt(result.expiresAt)
      setOtp('')
      setStep('otp')
    } finally {
      setLoading(false)
    }
  }

  const confirmCode = async (e) => {
    e.preventDefault()
    setError('')
    if (remainingSec <= 0) {
      setError(t.register.errors.otpExpired)
      return
    }
    const result = await verifyOtp(otp, 'reset')
    if (!result.ok) {
      setError(result.reason === 'EXPIRED' ? t.register.errors.otpExpired : t.register.errors.otpInvalid)
      return
    }
    setStep('password')
  }

  const savePassword = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError(t.register.errors.passwordShort)
      return
    }
    if (password !== passwordConfirm) {
      setError(t.register.errors.passwordMismatch)
      return
    }
    const pending = readPendingOtp()
    if (!pending || pending.purpose !== 'reset') {
      setError(t.register.errors.otpExpired)
      setStep('email')
      return
    }
    setLoading(true)
    try {
      await resetPasswordForEmail(pending.email, password)
      clearPendingOtp()
      navigate('/login', { replace: true })
    } catch {
      setError(f.errors.resetFailed)
    } finally {
      setLoading(false)
    }
  }

  const mm = String(Math.floor(remainingSec / 60)).padStart(2, '0')
  const ss = String(remainingSec % 60).padStart(2, '0')

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

          <h1 className="login-title">{f.title}</h1>
          <p className="login-soon">
            {step === 'email' ? f.introEmail : step === 'otp' ? f.introOtp : f.introPassword}
          </p>

          {error && (
            <div className="register-error" role="alert">
              {error}
            </div>
          )}

          {step === 'email' && (
            <form className="register-form login-form" onSubmit={sendCode}>
              <label className="register-label">
                {t.register.email}
                <input
                  className="register-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
              <button type="submit" className="btn btn-primary btn-lg register-submit" disabled={loading}>
                {loading ? f.sending : f.sendCode}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form className="register-form login-form" onSubmit={confirmCode}>
              <div className={`register-otp-timer ${remainingSec <= 30 ? 'is-urgent' : ''}`}>
                {t.register.otpExpiresIn}: {mm}:{ss}
              </div>
              <label className="register-label">
                {t.register.otpCode}
                <input
                  className="register-input register-input--otp"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                />
              </label>
              <button type="submit" className="btn btn-primary btn-lg register-submit">
                {t.register.otpVerify}
              </button>
              <button
                type="button"
                className="btn btn-ghost register-resend"
                disabled={loading || remainingSec > getOtpTtlMs() / 1000 - 15}
                onClick={() => sendCode({ preventDefault() {} })}
              >
                {t.register.otpResend}
              </button>
            </form>
          )}

          {step === 'password' && (
            <form className="register-form login-form" onSubmit={savePassword}>
              <label className="register-label">
                {t.register.password}
                <input
                  className="register-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>
              <label className="register-label">
                {t.register.passwordConfirm}
                <input
                  className="register-input"
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required
                />
              </label>
              <button type="submit" className="btn btn-primary btn-lg register-submit" disabled={loading}>
                {loading ? f.saving : f.savePassword}
              </button>
            </form>
          )}

          <Link to="/login" className="login-back">
            {f.backLogin}
          </Link>
        </div>
      </div>
    </div>
  )
}
