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

export async function createAndSendOtp({ email, profile = null, lang = 'ar', purpose = 'register' }) {
  const code = generateCode()
  const expiresAt = Date.now() + OTP_TTL_MS
  const emailed = await sendOtpEmail(email, code, lang, purpose)

  if (!emailed) {
    clearPendingOtp()
    return { ok: false, expiresAt: 0 }
  }

  const codeHash = await hashCode(code)
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

  return { ok: true, expiresAt }
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

async function sendOtpEmail(email, code, lang, purpose) {
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

  try {
    const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(email.trim())}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        _subject: subject,
        _template: 'box',
        _captcha: 'false',
        message,
      }),
    })
    if (!res.ok) return false
    const data = await res.json().catch(() => ({}))
    return data.success !== 'false' && data.success !== false
  } catch {
    return false
  }
}
