import { DEFAULT_BILAN_ROWS, emptyTcrAmounts } from '../config/financialTemplates'

function keyFor(userId) {
  return `anafin_financial_${userId}`
}

function readAll(userId) {
  try {
    const raw = localStorage.getItem(keyFor(userId))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeAll(userId, data) {
  localStorage.setItem(keyFor(userId), JSON.stringify(data))
}

function defaultState() {
  return {
    exerciseLabel: new Date().getFullYear().toString(),
    bilanRows: DEFAULT_BILAN_ROWS.map((r) => ({ ...r })),
    tcrAmounts: emptyTcrAmounts(),
    updatedAt: null,
  }
}

export function loadFinancial(userId) {
  const stored = readAll(userId)
  if (!stored) return defaultState()
  return {
    ...defaultState(),
    ...stored,
    bilanRows: Array.isArray(stored.bilanRows) && stored.bilanRows.length
      ? stored.bilanRows
      : defaultState().bilanRows,
    tcrAmounts: { ...emptyTcrAmounts(), ...(stored.tcrAmounts || {}) },
  }
}

export function saveFinancial(userId, patch) {
  const next = {
    ...loadFinancial(userId),
    ...patch,
    updatedAt: new Date().toISOString(),
  }
  writeAll(userId, next)
  return next
}
