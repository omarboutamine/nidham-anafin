import { useEffect, useId, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAlgerianUniversityEmail } from '../config/algerianUniversityEmails'
import {
  ACADEMIC_YEAR_OPTIONS,
  PROFESSION_VALUES,
} from '../config/registerOptions'
import { SUPERADMIN_EMAIL, createUser, findUserByEmail } from '../services/authStore'
import {
  clearPendingOtp,
  createAndSendOtp,
  getOtpTtlMs,
  readPendingOtp,
  verifyOtp,
} from '../services/otpService'
import DarkSelect from './DarkSelect'

const EMPTY_FORM = {
  fullName: '',
  birthDate: '',
  birthPlace: '',
  registrationNumber: '',
  profession: '',
  academicYear: '',
  email: '',
  phone: '',
}

export default function StudentRegisterModal({ open, onClose, t, dir, lang }) {
  const titleId = useId()
  const navigate = useNavigate()
  const r = t.register

  const [step, setStep] = useState('form')
  const [form, setForm] = useState(EMPTY_FORM)
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [expiresAt, setExpiresAt] = useState(0)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    if (!open || step !== 'otp' || !expiresAt) return undefined
    const id = window.setInterval(() => setNow(Date.now()), 500)
    return () => window.clearInterval(id)
  }, [open, step, expiresAt])

  useEffect(() => {
    if (!open) return
    const pending = readPendingOtp()
    if (pending?.profile) {
      setForm({ ...EMPTY_FORM, ...pending.profile })
      setExpiresAt(pending.expiresAt)
      setStep('otp')
    }
  }, [open])

  const remainingSec = useMemo(() => {
    if (!expiresAt) return 0
    return Math.max(0, Math.ceil((expiresAt - now) / 1000))
  }, [expiresAt, now])

  if (!open) return null

  const update = (key) => (e) => {
    const value = e.target.value
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'profession' && value !== PROFESSION_VALUES.STUDENT) {
        next.academicYear = ''
        next.registrationNumber = ''
      }
      return next
    })
  }

  const resetAll = () => {
    setStep('form')
    setForm(EMPTY_FORM)
    setOtp('')
    setPassword('')
    setPasswordConfirm('')
    setError('')
    setLoading(false)
    setExpiresAt(0)
    clearPendingOtp()
  }

  const handleClose = () => {
    resetAll()
    onClose()
  }

  const validateForm = () => {
    const required = [form.fullName, form.birthDate, form.birthPlace, form.profession, form.email, form.phone]
    if (required.some((v) => !String(v).trim())) return r.errors.required
    if (form.profession === PROFESSION_VALUES.STUDENT && !form.academicYear) {
      return r.errors.academicYear
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return r.errors.email
    if (!isAlgerianUniversityEmail(form.email) && form.email.trim().toLowerCase() !== SUPERADMIN_EMAIL) {
      return r.errors.universityEmail
    }
    if (!/^[0-9+\s()-]{8,20}$/.test(form.phone.trim())) return r.errors.phone
    if (findUserByEmail(form.email)) return r.errors.emailExists
    return ''
  }

  const handleSubmitForm = async (e) => {
    e.preventDefault()
    setError('')
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    try {
      const profile = {
        fullName: form.fullName.trim(),
        birthDate: form.birthDate,
        birthPlace: form.birthPlace.trim(),
        registrationNumber:
          form.profession === PROFESSION_VALUES.STUDENT ? form.registrationNumber.trim() : '',
        profession: form.profession,
        academicYear: form.profession === PROFESSION_VALUES.STUDENT ? form.academicYear : '',
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
      }
      const result = await createAndSendOtp({ email: profile.email, profile, lang })
      if (!result.ok) {
        setError(result.reason === 'ACTIVATION_REQUIRED' ? r.errors.activationRequired : r.errors.sendFailed)
        return
      }
      setExpiresAt(result.expiresAt)
      setOtp('')
      setStep('otp')
    } catch {
      setError(r.errors.sendFailed)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setError('')
    if (remainingSec <= 0) {
      setError(r.errors.otpExpired)
      return
    }
    const result = await verifyOtp(otp)
    if (!result.ok) {
      setError(result.reason === 'EXPIRED' ? r.errors.otpExpired : r.errors.otpInvalid)
      return
    }
    setStep('password')
    setError('')
  }

  const handleResendOtp = async () => {
    setError('')
    setLoading(true)
    try {
      const profile = {
        fullName: form.fullName.trim(),
        birthDate: form.birthDate,
        birthPlace: form.birthPlace.trim(),
        registrationNumber:
          form.profession === PROFESSION_VALUES.STUDENT ? form.registrationNumber.trim() : '',
        profession: form.profession,
        academicYear: form.profession === PROFESSION_VALUES.STUDENT ? form.academicYear : '',
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
      }
      const result = await createAndSendOtp({ email: profile.email, profile, lang })
      if (!result.ok) {
        setError(result.reason === 'ACTIVATION_REQUIRED' ? r.errors.activationRequired : r.errors.sendFailed)
        return
      }
      setExpiresAt(result.expiresAt)
      setOtp('')
      setNow(Date.now())
    } catch {
      setError(r.errors.sendFailed)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePassword = async (e) => {
    e.preventDefault()
    setError('')
    if (!password || !passwordConfirm) {
      setError(r.errors.required)
      return
    }
    if (password.length < 6) {
      setError(r.errors.passwordShort)
      return
    }
    if (password !== passwordConfirm) {
      setError(r.errors.passwordMismatch)
      return
    }

    const pending = readPendingOtp()
    if (!pending?.profile) {
      setError(r.errors.otpExpired)
      setStep('form')
      return
    }

    setLoading(true)
    try {
      await createUser({ profile: pending.profile, password })
      clearPendingOtp()
      handleClose()
      navigate('/dashboard')
    } catch (err) {
      setError(err?.message === 'EMAIL_EXISTS' ? r.errors.emailExists : r.errors.required)
    } finally {
      setLoading(false)
    }
  }

  const mm = String(Math.floor(remainingSec / 60)).padStart(2, '0')
  const ss = String(remainingSec % 60).padStart(2, '0')
  const yearOptions = ACADEMIC_YEAR_OPTIONS.map((opt) => ({
    value: opt.value,
    label: lang === 'fr' ? opt.fr : opt.ar,
  }))

  const title =
    step === 'otp' ? r.otpTitle : step === 'password' ? r.passwordTitle : r.title
  const intro =
    step === 'otp' ? r.otpIntro : step === 'password' ? r.passwordIntro : r.intro

  return (
    <div className="modal-overlay modal-overlay--landing" role="presentation" onClick={handleClose}>
      <div
        className="landing-panel-modal register-modal register-modal--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        dir={dir}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="landing-panel-modal__glow" aria-hidden="true" />
        <div className="landing-panel-modal__head">
          <div className="landing-panel-modal__head-text">
            <h2 id={titleId} className="landing-panel-modal__title">
              {title}
            </h2>
            <div className="landing-panel-modal__accent" />
            <p className="register-steps" aria-hidden="true">
              <span className={step === 'form' ? 'is-active' : ''}>1</span>
              <span className={step === 'otp' ? 'is-active' : ''}>2</span>
              <span className={step === 'password' ? 'is-active' : ''}>3</span>
            </p>
          </div>
          <button type="button" className="landing-panel-modal__close" onClick={handleClose}>
            {r.close}
          </button>
        </div>

        <div className="landing-panel-modal__body">
          <p className="landing-modal-intro">{intro}</p>
          {error && (
            <div className="register-error" role="alert">
              {error}
            </div>
          )}

          {step === 'form' && (
            <form className="register-form" onSubmit={handleSubmitForm}>
              <div className="register-grid">
                <label className="register-label">
                  {r.fullName}
                  <input className="register-input" value={form.fullName} onChange={update('fullName')} required />
                </label>
                <label className="register-label">
                  {r.birthDate}
                  <input
                    className="register-input"
                    type="date"
                    value={form.birthDate}
                    onChange={update('birthDate')}
                    required
                  />
                </label>
                <label className="register-label">
                  {r.birthPlace}
                  <input className="register-input" value={form.birthPlace} onChange={update('birthPlace')} required />
                </label>
                <label className="register-label">
                  {r.profession}
                  <DarkSelect
                    value={form.profession}
                    onChange={update('profession')}
                    required
                    aria-label={r.profession}
                    options={[
                      { value: PROFESSION_VALUES.NONE, label: r.professionPlaceholder },
                      { value: PROFESSION_VALUES.STUDENT, label: r.professionStudent },
                      { value: PROFESSION_VALUES.PROFESSOR, label: r.professionProfessor },
                    ]}
                  />
                </label>
                {form.profession === PROFESSION_VALUES.STUDENT && (
                  <label className="register-label">
                    {r.registrationNumber}
                    <input
                      className="register-input"
                      value={form.registrationNumber}
                      onChange={update('registrationNumber')}
                      placeholder={r.registrationNumberOptional}
                      autoComplete="off"
                    />
                  </label>
                )}
                {form.profession === PROFESSION_VALUES.STUDENT && (
                  <label className="register-label">
                    {r.academicYear}
                    <DarkSelect
                      value={form.academicYear}
                      onChange={update('academicYear')}
                      required
                      aria-label={r.academicYear}
                      options={[
                        { value: '', label: r.academicYearPlaceholder },
                        ...yearOptions.map((opt) => ({ value: opt.value, label: opt.label })),
                      ]}
                    />
                  </label>
                )}
                <label className="register-label">
                  {r.email}
                  <input
                    className="register-input"
                    type="email"
                    value={form.email}
                    onChange={update('email')}
                    placeholder={r.emailPlaceholder}
                    required
                    autoComplete="email"
                  />
                </label>
                <label className="register-label">
                  {r.phone}
                  <input
                    className="register-input"
                    type="tel"
                    value={form.phone}
                    onChange={update('phone')}
                    placeholder={r.phonePlaceholder}
                    required
                  />
                </label>
              </div>
              <button type="submit" className="btn btn-primary btn-lg register-submit" disabled={loading}>
                {loading ? r.submitting : r.submit}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form className="register-form" onSubmit={handleVerifyOtp}>
              <p className="register-otp-mail">
                {r.otpSentTo} <strong>{form.email}</strong>
              </p>
              <div className={`register-otp-timer ${remainingSec <= 30 ? 'is-urgent' : ''}`}>
                {r.otpExpiresIn}: {mm}:{ss}
              </div>
              <label className="register-label">
                {r.otpCode}
                <input
                  className="register-input register-input--otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                />
              </label>
              <button type="submit" className="btn btn-primary btn-lg register-submit" disabled={loading}>
                {r.otpVerify}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-lg register-resend"
                onClick={handleResendOtp}
                disabled={loading || remainingSec > getOtpTtlMs() / 1000 - 15}
              >
                {r.otpResend}
              </button>
            </form>
          )}

          {step === 'password' && (
            <form className="register-form" onSubmit={handleCreatePassword}>
              <label className="register-label">
                {r.password}
                <input
                  className="register-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </label>
              <label className="register-label">
                {r.passwordConfirm}
                <input
                  className="register-input"
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </label>
              <button type="submit" className="btn btn-primary btn-lg register-submit" disabled={loading}>
                {loading ? r.creatingAccount : r.finish}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
