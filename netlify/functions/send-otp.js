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

function buildMail(lang, code) {
  if (lang === 'fr') {
    return {
      subject: 'Code de vérification — Nidham Anafin',
      text: `Votre code de vérification Nidham Anafin est : ${code}\nIl est valable 3 minutes.\nNe partagez ce code avec personne.`,
      html: `<p>Votre code de vérification <strong>Nidham Anafin</strong> est :</p>
<p style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</p>
<p>Il est valable <strong>3 minutes</strong>. Ne partagez ce code avec personne.</p>`,
    }
  }
  return {
    subject: 'رمز التحقق — Nidham Anafin',
    text: `رمز التحقق الخاص بك في Nidham Anafin هو: ${code}\nصالح لمدة 3 دقائق فقط.\nلا تشارك هذا الرمز مع أي شخص.`,
    html: `<p dir="rtl">رمز التحقق الخاص بك في <strong>Nidham Anafin</strong> هو:</p>
<p dir="rtl" style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</p>
<p dir="rtl">صالح لمدة <strong>3 دقائق</strong> فقط. لا تشارك هذا الرمز مع أي شخص.</p>`,
  }
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, error: 'METHOD_NOT_ALLOWED' })
  }

  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER || process.env.MAIL_FROM
  const pass = process.env.SMTP_PASS
  const from = process.env.MAIL_FROM || user

  if (!host || !user || !pass || !from) {
    return json(500, {
      ok: false,
      error: 'SMTP_NOT_CONFIGURED',
      message: 'Configure SMTP_HOST, SMTP_USER, SMTP_PASS, MAIL_FROM in Netlify.',
    })
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

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(400, { ok: false, error: 'INVALID_EMAIL' })
  }

  const code = String(crypto.randomInt(100000, 1000000))
  const expiresAt = Date.now() + OTP_TTL_MS
  const codeHash = hashCode(code)
  const mail = buildMail(lang, code)

  try {
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

    return json(200, { ok: true, expiresAt, codeHash })
  } catch (err) {
    console.error('send-otp failed', err)
    return json(502, {
      ok: false,
      error: 'SEND_FAILED',
      message: err?.message || 'SMTP send failed',
    })
  }
}
