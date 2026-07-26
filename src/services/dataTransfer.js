/** Export / import all Anafin localStorage payloads (users, companies, financials). */

const PREFIX = 'anafin_'

export function collectAnafinStorage() {
  const data = {}
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i)
    if (key && key.startsWith(PREFIX)) {
      data[key] = localStorage.getItem(key)
    }
  }
  return data
}

export function buildExportPayload() {
  return {
    app: 'nidham-anafin',
    version: 1,
    exportedAt: new Date().toISOString(),
    data: collectAnafinStorage(),
  }
}

export function downloadAnafinExport(filename = 'anafin-data-export.json') {
  const payload = buildExportPayload()
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
  return payload
}

export function parseImportPayload(raw) {
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
  const data = parsed?.data && typeof parsed.data === 'object' ? parsed.data : parsed
  if (!data || typeof data !== 'object') throw new Error('INVALID_PAYLOAD')
  const entries = Object.entries(data).filter(([key]) => typeof key === 'string' && key.startsWith(PREFIX))
  if (!entries.length) throw new Error('EMPTY_PAYLOAD')
  return Object.fromEntries(entries)
}

export function applyAnafinImport(raw, { clearExisting = true } = {}) {
  const data = parseImportPayload(raw)
  if (clearExisting) {
    const toRemove = []
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (key && key.startsWith(PREFIX)) toRemove.push(key)
    }
    toRemove.forEach((key) => localStorage.removeItem(key))
  }
  Object.entries(data).forEach(([key, value]) => {
    if (value == null) return
    localStorage.setItem(key, String(value))
  })
  return Object.keys(data).length
}
