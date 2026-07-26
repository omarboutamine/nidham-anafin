import crypto from 'node:crypto'
import nodemailer from 'nodemailer'

const OTP_TTL_MS = 3 * 60 * 1000

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(body),
  }
}

function hashCode(code) {
  return crypto.createHash('sha256').update(String(code).trim()).digest('hex')
}

function buildMail(lang, code, purpose) {
  const isReset = purpose === 'reset'
  if (lang === 'fr') {
    return {
      subject: isReset
        ? 'Réinitialisation du mot de passe — Nidham Anafin'
        : 'Code de vérification — Nidham Anafin',
      text: isReset
        ? `Votre code de réinitialisation Nidham Anafin est : ${code}\nIl est valable 3 minutes.\nNe partagez ce code avec personne.`
        : `Votre code de vérification Nidham Anafin est : ${code}\nIl est valable 3 minutes.\nNe partagez ce code avec personne.`,
      html: `<p>${isReset ? 'Votre code de réinitialisation' : 'Votre code de vérification'} <strong>Nidham Anafin</strong> est :</p>
<p style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</p>
<p>Il est valable <strong>3 minutes</strong>. Ne partagez ce code avec personne.</p>`,
    }
  }
  return {
    subject: isReset
      ? 'إعادة تعيين كلمة المرور — Nidham Anafin'
      : 'رمز التحقق — Nidham Anafin',
    text: isReset
      ? `رمز إعادة تعيين كلمة المرور في Nidham Anafin هو: ${code}\nصالح لمدة 3 دقائق فقط.\nلا تشارك هذا الرمز مع أي شخص.`
      : `رمز التحقق الخاص بك في Nidham Anafin هو: ${code}\nصالح لمدة 3 دقائق فقط.\nلا تشارك هذا الرمز مع أي شخص.`,
    html: `<p dir="rtl">${isReset ? 'رمز إعادة تعيين كلمة المرور' : 'رمز التحقق الخاص بك'} في <strong>Nidham Anafin</strong> هو:</p>
<p dir="rtl" style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</p>
<p dir="rtl">صالح لمدة <strong>3 دقائق</strong> فقط. لا تشارك هذا الرمز مع أي شخص.</p>`,
  }
}

function smtpConfigured() {
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER || process.env.MAIL_FROM
  const pass = process.env.SMTP_PASS
  const from = process.env.MAIL_FROM || user
  return Boolean(host && user && pass && from)
}

async function sendViaSmtp(email, mail) {
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER || process.env.MAIL_FROM
  const pass = process.env.SMTP_PASS
  const from = process.env.MAIL_FROM || user
  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: { user, pass },
  })
  await transporter.sendMail({
    from,
    to: email,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
    replyTo: from,
  })
}

async function sendViaFormSubmit(email, mail) {
  const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(email)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      name: 'Nidham Anafin',
      email,
      _subject: mail.subject,
      _template: 'box',
      _captcha: 'false',
      message: mail.text,
    }),
  })

  const data = await res.json().catch(() => ({}))
  const msg = String(data.message || data.error || '')
  const success = data.success === true || data.success === 'true'

  if (res.ok && success) return { ok: true }

  if (/activat|confirm your email|confirmation link/i.test(msg)) {
    return { ok: false, error: 'ACTIVATION_REQUIRED', message: msg }
  }

  // First contact often returns non-success until the inbox is activated.
  if (!success && /email|inbox|spam/i.test(msg)) {
    return { ok: false, error: 'ACTIVATION_REQUIRED', message: msg }
  }

  return {
    ok: false,
    error: res.ok ? 'SEND_FAILED' : 'SEND_FAILED',
    message: msg || `HTTP_${res.status}`,
  }
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, error: 'METHOD_NOT_ALLOWED' })
  }

  let payload
  try {
    payload = JSON.parse(event.body || '{}')
  } catch {
    return json(400, { ok: false, error: 'INVALID_JSON' })
  }

  const email = String(payload.email || '')
    .trim()
    .toLowerCase()
  const lang = payload.lang === 'fr' ? 'fr' : 'ar'
  const purpose = payload.purpose === 'reset' ? 'reset' : 'register'

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(400, { ok: false, error: 'INVALID_EMAIL' })
  }

  const code = String(crypto.randomInt(100000, 1000000))
  const expiresAt = Date.now() + OTP_TTL_MS
  const codeHash = hashCode(code)
  const mail = buildMail(lang, code, purpose)

  try {
    if (smtpConfigured()) {
      await sendViaSmtp(email, mail)
      return json(200, { ok: true, expiresAt, codeHash, via: 'smtp' })
    }

    const submitted = await sendViaFormSubmit(email, mail)
    if (!submitted.ok) {
      return json(submitted.error === 'ACTIVATION_REQUIRED' ? 409 : 502, {
        ok: false,
        error: submitted.error,
        message: submitted.message,
      })
    }

    return json(200, { ok: true, expiresAt, codeHash, via: 'formsubmit' })
  } catch (err) {
    console.error('send-otp failed', err)
    return json(502, {
      ok: false,
      error: 'SEND_FAILED',
      message: err?.message || 'send failed',
    })
  }
}
