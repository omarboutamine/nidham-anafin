import { DEFAULT_BILAN_ROWS, emptyTcrAmounts } from '../config/financialTemplates'

function keyFor(userId) {
  return `anafin_financial_${userId}`
}

function readRaw(userId) {
  try {
    const raw = localStorage.getItem(keyFor(userId))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeRaw(userId, data) {
  localStorage.setItem(keyFor(userId), JSON.stringify(data))
}

function blankYearData() {
  return {
    bilanRows: DEFAULT_BILAN_ROWS.map((r) => ({ ...r })),
    tcrAmounts: emptyTcrAmounts(),
    updatedAt: null,
  }
}

function currentYear() {
  return String(new Date().getFullYear())
}

/** Migrate legacy single-year shape → multi-year. */
function normalizeStore(stored) {
  if (!stored) {
    const y = currentYear()
    return {
      activeYear: y,
      years: { [y]: blankYearData() },
    }
  }

  if (stored.years && typeof stored.years === 'object') {
    const years = { ...stored.years }
    let activeYear = String(stored.activeYear || Object.keys(years)[0] || currentYear())
    if (!years[activeYear]) {
      const keys = Object.keys(years).sort()
      activeYear = keys[keys.length - 1] || currentYear()
      if (!years[activeYear]) years[activeYear] = blankYearData()
    }
    return { activeYear, years }
  }

  // Legacy: exerciseLabel + bilanRows + tcrAmounts
  const y = String(stored.exerciseLabel || currentYear())
  return {
    activeYear: y,
    years: {
      [y]: {
        bilanRows:
          Array.isArray(stored.bilanRows) && stored.bilanRows.length
            ? stored.bilanRows
            : blankYearData().bilanRows,
        tcrAmounts: { ...emptyTcrAmounts(), ...(stored.tcrAmounts || {}) },
        updatedAt: stored.updatedAt || null,
      },
    },
  }
}

export function listYears(userId) {
  const store = normalizeStore(readRaw(userId))
  return Object.keys(store.years).sort((a, b) => Number(b) - Number(a) || String(b).localeCompare(String(a)))
}

export function getActiveYear(userId) {
  return normalizeStore(readRaw(userId)).activeYear
}

export function setActiveYear(userId, year) {
  const store = normalizeStore(readRaw(userId))
  const y = String(year).trim()
  if (!y) return store
  if (!store.years[y]) store.years[y] = blankYearData()
  store.activeYear = y
  writeRaw(userId, store)
  return store
}

export function addYear(userId, year) {
  const y = String(year).trim()
  if (!/^\d{4}$/.test(y)) throw new Error('INVALID_YEAR')
  const store = normalizeStore(readRaw(userId))
  if (!store.years[y]) store.years[y] = blankYearData()
  store.activeYear = y
  writeRaw(userId, store)
  return store
}

export function removeYear(userId, year) {
  const store = normalizeStore(readRaw(userId))
  const y = String(year)
  const keys = Object.keys(store.years)
  if (keys.length <= 1 || !store.years[y]) return store
  delete store.years[y]
  if (store.activeYear === y) {
    store.activeYear = Object.keys(store.years).sort((a, b) => Number(b) - Number(a))[0]
  }
  writeRaw(userId, store)
  return store
}

export function loadFinancial(userId, year) {
  const store = normalizeStore(readRaw(userId))
  const y = String(year || store.activeYear)
  const data = store.years[y] || blankYearData()
  return {
    activeYear: y,
    years: Object.keys(store.years).sort((a, b) => Number(b) - Number(a)),
    exerciseLabel: y,
    bilanRows: data.bilanRows?.length ? data.bilanRows : blankYearData().bilanRows,
    tcrAmounts: { ...emptyTcrAmounts(), ...(data.tcrAmounts || {}) },
    updatedAt: data.updatedAt || null,
  }
}

export function saveFinancial(userId, patch) {
  const store = normalizeStore(readRaw(userId))
  const y = String(patch.exerciseLabel || patch.activeYear || store.activeYear)
  if (!store.years[y]) store.years[y] = blankYearData()
  const prev = store.years[y]
  store.years[y] = {
    bilanRows: patch.bilanRows ?? prev.bilanRows,
    tcrAmounts: patch.tcrAmounts ?? prev.tcrAmounts,
    updatedAt: new Date().toISOString(),
  }
  store.activeYear = y
  writeRaw(userId, store)
  return loadFinancial(userId, y)
}
