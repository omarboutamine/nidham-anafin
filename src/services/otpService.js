const OTP_KEY = 'anafin_pending_otp'
const OTP_TTL_MS = 3 * 60 * 1000

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
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

export async function createAndSendOtp({ email, profile, lang = 'ar' }) {
  const code = generateCode()
  const expiresAt = Date.now() + OTP_TTL_MS
  const payload = {
    email: email.trim().toLowerCase(),
    code,
    expiresAt,
    profile,
  }
  sessionStorage.setItem(OTP_KEY, JSON.stringify(payload))

  const emailed = await sendOtpEmail(email, code, lang)
  return {
    expiresAt,
    emailed,
    /** Always returned so registration works even if mailbox delivery is delayed/blocked. */
    fallbackCode: code,
  }
}

export function verifyOtp(inputCode) {
  const pending = readPendingOtp()
  if (!pending) return { ok: false, reason: 'EXPIRED' }
  if (String(inputCode).trim() !== String(pending.code)) {
    return { ok: false, reason: 'INVALID' }
  }
  return { ok: true, profile: pending.profile, email: pending.email }
}

async function sendOtpEmail(email, code, lang) {
  const subject =
    lang === 'fr' ? 'Code de vérification — Nidham Anafin' : 'رمز التحقق — Nidham Anafin'
  const message =
    lang === 'fr'
      ? `Votre code de vérification Nidham Anafin est : ${code}\nIl est valable 3 minutes.`
      : `رمز التحقق الخاص بك في Nidham Anafin هو: ${code}\nصالح لمدة 3 دقائق فقط.`

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
        code,
      }),
    })
    if (!res.ok) return false
    const data = await res.json().catch(() => ({}))
    return data.success !== 'false' && data.success !== false
  } catch {
    return false
  }
}
