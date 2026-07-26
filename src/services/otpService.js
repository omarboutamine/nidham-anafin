const OTP_KEY = 'anafin_pending_otp'
const OTP_TTL_MS = 3 * 60 * 1000

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

async function hashCode(code) {
  const data = new TextEncoder().encode(String(code).trim())
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function getOtpTtlMs() {
  return OTP_TTL_MS
}

export function clearPendingOtp() {
  sessionStorage.removeItem(OTP_KEY)
}

export function readPendingOtp() {
  try {
    const raw = sessionStorage.getItem(OTP_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (Date.now() > data.expiresAt) {
      clearPendingOtp()
      return null
    }
    return data
  } catch {
    return null
  }
}

function otpApiUrl() {
  const configured = import.meta.env.VITE_OTP_API_URL
  if (configured) return configured
  return '/api/send-otp'
}

function storePending({ email, codeHash, expiresAt, profile, purpose }) {
  sessionStorage.setItem(
    OTP_KEY,
    JSON.stringify({
      email: email.trim().toLowerCase(),
      codeHash,
      expiresAt,
      profile,
      purpose,
    }),
  )
}

function classifyFormSubmitFailure(data, status) {
  const msg = String(data?.message || data?.error || '')
  if (/activat|confirm your email|confirmation link|initialize/i.test(msg)) {
    return 'ACTIVATION_REQUIRED'
  }
  if (status === 409) return 'ACTIVATION_REQUIRED'
  return 'SEND_FAILED'
}

async function sendOtpViaFormSubmit(email, code, lang, purpose) {
  const isReset = purpose === 'reset'
  const subject =
    lang === 'fr'
      ? isReset
        ? 'Réinitialisation du mot de passe — Nidham Anafin'
        : 'Code de vérification — Nidham Anafin'
      : isReset
        ? 'إعادة تعيين كلمة المرور — Nidham Anafin'
        : 'رمز التحقق — Nidham Anafin'
  const message =
    lang === 'fr'
      ? isReset
        ? `Votre code de réinitialisation Nidham Anafin est : ${code}\nIl est valable 3 minutes.\nNe partagez ce code avec personne.`
        : `Votre code de vérification Nidham Anafin est : ${code}\nIl est valable 3 minutes.\nNe partagez ce code avec personne.`
      : isReset
        ? `رمز إعادة تعيين كلمة المرور في Nidham Anafin هو: ${code}\nصالح لمدة 3 دقائق فقط.\nلا تشارك هذا الرمز مع أي شخص.`
        : `رمز التحقق الخاص بك في Nidham Anafin هو: ${code}\nصالح لمدة 3 دقائق فقط.\nلا تشارك هذا الرمز مع أي شخص.`

  const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(email.trim())}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      name: 'Nidham Anafin',
      email: email.trim(),
      _subject: subject,
      _template: 'box',
      _captcha: 'false',
      message,
    }),
  })

  const data = await res.json().catch(() => ({}))
  const success = data.success === true || data.success === 'true'
  if (res.ok && success) return { ok: true }
  return { ok: false, reason: classifyFormSubmitFailure(data, res.status), message: data.message }
}

async function sendOtpViaApi({ email, lang, purpose }) {
  const res = await fetch(otpApiUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      lang,
      purpose,
    }),
  })

  const data = await res.json().catch(() => ({}))
  if (res.ok && data.ok && data.codeHash && data.expiresAt) {
    return {
      ok: true,
      expiresAt: data.expiresAt,
      codeHash: data.codeHash,
    }
  }

  return {
    ok: false,
    reason: data.error === 'ACTIVATION_REQUIRED' ? 'ACTIVATION_REQUIRED' : 'SEND_FAILED',
    message: data.message,
  }
}

export async function createAndSendOtp({ email, profile = null, lang = 'ar', purpose = 'register' }) {
  clearPendingOtp()
  const normalizedEmail = email.trim().toLowerCase()

  // Prefer Netlify function (SMTP if configured, else FormSubmit server-side).
  try {
    const apiResult = await sendOtpViaApi({ email: normalizedEmail, lang, purpose })
    if (apiResult.ok) {
      storePending({
        email: normalizedEmail,
        codeHash: apiResult.codeHash,
        expiresAt: apiResult.expiresAt,
        profile,
        purpose,
      })
      return { ok: true, expiresAt: apiResult.expiresAt }
    }
    // On local Vite without Netlify functions, fall through to client FormSubmit.
    if (apiResult.reason === 'ACTIVATION_REQUIRED') {
      return { ok: false, expiresAt: 0, reason: 'ACTIVATION_REQUIRED' }
    }
  } catch {
    // fall through
  }

  try {
    const code = generateCode()
    const expiresAt = Date.now() + OTP_TTL_MS
    const emailed = await sendOtpViaFormSubmit(normalizedEmail, code, lang, purpose)
    if (!emailed.ok) {
      return { ok: false, expiresAt: 0, reason: emailed.reason || 'SEND_FAILED' }
    }
    const codeHash = await hashCode(code)
    storePending({ email: normalizedEmail, codeHash, expiresAt, profile, purpose })
    return { ok: true, expiresAt }
  } catch {
    return { ok: false, expiresAt: 0, reason: 'SEND_FAILED' }
  }
}

export async function verifyOtp(inputCode, expectedPurpose) {
  const pending = readPendingOtp()
  if (!pending) return { ok: false, reason: 'EXPIRED' }
  if (expectedPurpose && pending.purpose !== expectedPurpose) {
    return { ok: false, reason: 'INVALID' }
  }
  const inputHash = await hashCode(inputCode)
  if (inputHash !== pending.codeHash) {
    return { ok: false, reason: 'INVALID' }
  }
  return { ok: true, profile: pending.profile, email: pending.email, purpose: pending.purpose }
}
