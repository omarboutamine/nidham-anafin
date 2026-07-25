const OTP_KEY = 'anafin_pending_otp'
const OTP_TTL_MS = 3 * 60 * 1000

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

export async function createAndSendOtp({ email, profile, lang = 'ar' }) {
  clearPendingOtp()

  try {
    const res = await fetch(otpApiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        lang,
      }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.ok || !data.codeHash || !data.expiresAt) {
      return { ok: false, expiresAt: 0 }
    }

    sessionStorage.setItem(
      OTP_KEY,
      JSON.stringify({
        email: email.trim().toLowerCase(),
        codeHash: data.codeHash,
        expiresAt: data.expiresAt,
        profile,
      }),
    )

    return { ok: true, expiresAt: data.expiresAt }
  } catch {
    return { ok: false, expiresAt: 0 }
  }
}

export async function verifyOtp(inputCode) {
  const pending = readPendingOtp()
  if (!pending) return { ok: false, reason: 'EXPIRED' }
  const inputHash = await hashCode(inputCode)
  if (inputHash !== pending.codeHash) {
    return { ok: false, reason: 'INVALID' }
  }
  return { ok: true, profile: pending.profile, email: pending.email }
}
