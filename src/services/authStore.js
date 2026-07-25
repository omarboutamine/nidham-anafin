const USERS_KEY = 'anafin_users'
const SESSION_KEY = 'anafin_session'

function readUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

async function hashPassword(password, salt) {
  const data = new TextEncoder().encode(`${salt}:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function makeSalt() {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function makeId() {
  if (crypto.randomUUID) return crypto.randomUUID()
  return `u_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

export function findUserByEmail(email) {
  const normalized = email.trim().toLowerCase()
  return readUsers().find((u) => u.email === normalized) || null
}

export async function createUser({ profile, password }) {
  const email = profile.email.trim().toLowerCase()
  if (findUserByEmail(email)) {
    throw new Error('EMAIL_EXISTS')
  }

  const salt = makeSalt()
  const passwordHash = await hashPassword(password, salt)
  const user = {
    id: makeId(),
    ...profile,
    email,
    salt,
    passwordHash,
    createdAt: new Date().toISOString(),
  }

  const users = readUsers()
  users.push(user)
  writeUsers(users)

  const session = { userId: user.id, email: user.email, at: Date.now() }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return sanitizeUser(user)
}

export async function loginWithPassword(email, password) {
  const user = findUserByEmail(email)
  if (!user) throw new Error('INVALID_CREDENTIALS')
  const hash = await hashPassword(password, user.salt)
  if (hash !== user.passwordHash) throw new Error('INVALID_CREDENTIALS')

  const session = { userId: user.id, email: user.email, at: Date.now() }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return sanitizeUser(user)
}

export function logout() {
  localStorage.removeItem(SESSION_KEY)
}

export function getSessionUser() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw)
    const users = readUsers()
    const user = users.find((u) => u.id === session.userId)
    return user ? sanitizeUser(user) : null
  } catch {
    return null
  }
}

function sanitizeUser(user) {
  const { passwordHash, salt, ...safe } = user
  return safe
}
