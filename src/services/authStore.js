const USERS_KEY = 'anafin_users'
const SESSION_KEY = 'anafin_session'

/** Bootstrap superadmin mailbox (site owner). */
export const SUPERADMIN_EMAIL = 'omar.boutamine@univ-constantine2.dz'

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

function withDefaults(user) {
  return {
    ...user,
    role: user.role || (user.email === SUPERADMIN_EMAIL ? 'superadmin' : 'user'),
    active: user.active !== false,
  }
}

function migrateUsers() {
  const users = readUsers().map(withDefaults)
  const changed = users.some((u, i) => {
    const raw = readUsers()[i]
    return raw?.role !== u.role || raw?.active !== u.active
  })
  if (changed || readUsers().length !== users.length) writeUsers(users)
  return users
}

export function findUserByEmail(email) {
  const normalized = email.trim().toLowerCase()
  return migrateUsers().find((u) => u.email === normalized) || null
}

export async function createUser({ profile, password }) {
  const email = profile.email.trim().toLowerCase()
  if (findUserByEmail(email)) {
    throw new Error('EMAIL_EXISTS')
  }

  const salt = makeSalt()
  const passwordHash = await hashPassword(password, salt)
  const user = withDefaults({
    id: makeId(),
    ...profile,
    email,
    salt,
    passwordHash,
    role: email === SUPERADMIN_EMAIL ? 'superadmin' : 'user',
    active: true,
    createdAt: new Date().toISOString(),
  })

  const users = migrateUsers()
  users.push(user)
  writeUsers(users)

  const session = { userId: user.id, email: user.email, at: Date.now() }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return sanitizeUser(user)
}

export async function loginWithPassword(email, password) {
  const user = findUserByEmail(email)
  if (!user) throw new Error('INVALID_CREDENTIALS')
  if (user.active === false) throw new Error('ACCOUNT_DISABLED')
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
    const users = migrateUsers()
    const user = users.find((u) => u.id === session.userId)
    if (!user) return null
    if (user.active === false) {
      logout()
      return null
    }
    return sanitizeUser(user)
  } catch {
    return null
  }
}

export function listUsers() {
  return migrateUsers()
    .map(sanitizeUser)
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
}

export function setUserActive(userId, active) {
  const users = migrateUsers()
  const idx = users.findIndex((u) => u.id === userId)
  if (idx < 0) throw new Error('NOT_FOUND')
  if (users[idx].role === 'superadmin' && !active) {
    throw new Error('CANNOT_DISABLE_SUPERADMIN')
  }
  users[idx] = { ...users[idx], active: !!active }
  writeUsers(users)
  return sanitizeUser(users[idx])
}

export async function resetPasswordForEmail(email, newPassword) {
  const users = migrateUsers()
  const idx = users.findIndex((u) => u.email === email.trim().toLowerCase())
  if (idx < 0) throw new Error('NOT_FOUND')
  if (users[idx].active === false) throw new Error('ACCOUNT_DISABLED')
  const salt = makeSalt()
  const passwordHash = await hashPassword(newPassword, salt)
  users[idx] = { ...users[idx], salt, passwordHash }
  writeUsers(users)
  return sanitizeUser(users[idx])
}

function sanitizeUser(user) {
  const { passwordHash, salt, ...safe } = withDefaults(user)
  return safe
}
