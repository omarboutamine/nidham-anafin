import { useEffect, useId, useState } from 'react'
import { isAlgerianUniversityEmail } from '../config/algerianUniversityEmails'

export default function StudentRegisterModal({ open, onClose, t, dir }) {
  const titleId = useId()
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    university: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const r = t.register
  const update = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!form.fullName.trim() || !form.email.trim() || !form.university.trim() || !form.password.trim()) {
      setError(r.errors.required)
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError(r.errors.email)
      return
    }
    if (!isAlgerianUniversityEmail(form.email)) {
      setError(r.errors.universityEmail)
      return
    }

    setLoading(true)
    try {
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        university: form.university.trim(),
        createdAt: new Date().toISOString(),
      }
      const prev = JSON.parse(localStorage.getItem('anafin_register_requests') || '[]')
      prev.push(payload)
      localStorage.setItem('anafin_register_requests', JSON.stringify(prev))
      setSuccess(true)
      setForm({ fullName: '', email: '', university: '', password: '' })
    } catch {
      setError(r.errors.required)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay modal-overlay--landing" role="presentation" onClick={onClose}>
      <div
        className="landing-panel-modal register-modal"
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
              {r.title}
            </h2>
            <div className="landing-panel-modal__accent" />
          </div>
          <button type="button" className="landing-panel-modal__close" onClick={onClose}>
            {r.close}
          </button>
        </div>
        <div className="landing-panel-modal__body">
          <p className="landing-modal-intro">{r.intro}</p>

          {success ? (
            <div className="register-success" role="status">
              {r.success}
            </div>
          ) : (
            <form className="register-form" onSubmit={handleSubmit}>
              {error && (
                <div className="register-error" role="alert">
                  {error}
                </div>
              )}
              <label className="register-label">
                {r.fullName}
                <input className="register-input" value={form.fullName} onChange={update('fullName')} required />
              </label>
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
                {r.university}
                <input
                  className="register-input"
                  value={form.university}
                  onChange={update('university')}
                  required
                />
              </label>
              <label className="register-label">
                {r.password}
                <input
                  className="register-input"
                  type="password"
                  value={form.password}
                  onChange={update('password')}
                  required
                  autoComplete="new-password"
                />
              </label>

              <button type="submit" className="btn btn-primary btn-lg register-submit" disabled={loading}>
                {loading ? r.submitting : r.submit}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
