import { useEffect, useId, useRef, useState } from 'react'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']

export default function StudentRegisterModal({ open, onClose, t, dir }) {
  const titleId = useId()
  const fileInputRef = useRef(null)
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    university: '',
    studentId: '',
    password: '',
  })
  const [cardFile, setCardFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
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

  useEffect(() => {
    if (!cardFile) {
      setPreviewUrl('')
      return undefined
    }
    const url = URL.createObjectURL(cardFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [cardFile])

  if (!open) return null

  const r = t.register

  const update = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const onFileChange = (e) => {
    const file = e.target.files?.[0]
    setError('')
    if (!file) {
      setCardFile(null)
      return
    }
    if (!IMAGE_TYPES.includes(file.type)) {
      setError(r.errors.fileType)
      setCardFile(null)
      return
    }
    setCardFile(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (
      !form.fullName.trim() ||
      !form.email.trim() ||
      !form.university.trim() ||
      !form.studentId.trim() ||
      !form.password.trim() ||
      !cardFile
    ) {
      setError(r.errors.required)
      return
    }
    if (!EMAIL_RE.test(form.email.trim())) {
      setError(r.errors.email)
      return
    }

    setLoading(true)
    try {
      // Étape actuelle : UI + stockage local (backend plus tard)
      const payload = {
        ...form,
        email: form.email.trim().toLowerCase(),
        cardFileName: cardFile.name,
        cardSize: cardFile.size,
        createdAt: new Date().toISOString(),
      }
      const prev = JSON.parse(localStorage.getItem('anafin_register_requests') || '[]')
      prev.push(payload)
      localStorage.setItem('anafin_register_requests', JSON.stringify(prev))
      setSuccess(true)
      setForm({ fullName: '', email: '', university: '', studentId: '', password: '' })
      setCardFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
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
                  required
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
                {r.studentId}
                <input
                  className="register-input"
                  value={form.studentId}
                  onChange={update('studentId')}
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

              <div className="register-card-field">
                <span className="register-label-text">{r.cardLabel}</span>
                <p className="register-card-hint">{r.cardHint}</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="register-file-input"
                  onChange={onFileChange}
                />
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {cardFile ? r.fileSelected : r.chooseFile}
                </button>
                {cardFile && <span className="register-file-name">{cardFile.name}</span>}
                {previewUrl && (
                  <img src={previewUrl} alt="" className="register-card-preview" />
                )}
              </div>

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
