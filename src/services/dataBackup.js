import { LANDING_LANG_KEY } from '../config/landingI18n'

const BACKUP_VERSION = 1

function isAnafinKey(key) {
  return (
    key === 'anafin_users' ||
    key === 'anafin_session' ||
    key === LANDING_LANG_KEY ||
    key.startsWith('anafin_companies_') ||
    key.startsWith('anafin_financial_')
  )
}

export function collectAnafinBackup() {
  const data = {}
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i)
    if (key && isAnafinKey(key)) {
      data[key] = localStorage.getItem(key)
    }
  }
  return {
    version: BACKUP_VERSION,
    app: 'nidham-anafin',
    exportedAt: new Date().toISOString(),
    data,
  }
}

export function downloadAnafinBackup(filename) {
  const backup = collectAnafinBackup()
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || `nidham-anafin-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  return backup
}

export function parseAnafinBackup(raw) {
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
  if (!parsed || typeof parsed !== 'object' || !parsed.data || typeof parsed.data !== 'object') {
    throw new Error('INVALID_BACKUP')
  }
  return parsed
}

/** Replace local anafin keys with backup contents. */
export function importAnafinBackup(raw, { clearExisting = true } = {}) {
  const backup = parseAnafinBackup(raw)
  if (clearExisting) {
    const toRemove = []
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (key && isAnafinKey(key)) toRemove.push(key)
    }
    toRemove.forEach((key) => localStorage.removeItem(key))
  }
  Object.entries(backup.data).forEach(([key, value]) => {
    if (isAnafinKey(key) && typeof value === 'string') {
      localStorage.setItem(key, value)
    }
  })
  return backup
}
