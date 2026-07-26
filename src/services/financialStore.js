import { DEFAULT_BILAN_ROWS, emptyTcrAmounts } from '../config/financialTemplates'
import { financialStorageKey, getActiveCompanyId } from './companyStore'

function keyFor(userId, companyId) {
  const cid = companyId || getActiveCompanyId(userId)
  return financialStorageKey(userId, cid)
}

function readRaw(userId, companyId) {
  const key = keyFor(userId, companyId)
  if (!key) return null
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeRaw(userId, data, companyId) {
  const key = keyFor(userId, companyId)
  if (!key) throw new Error('NO_COMPANY')
  localStorage.setItem(key, JSON.stringify(data))
}

function blankYearData() {
  return {
    bilanRows: DEFAULT_BILAN_ROWS.map((r) => ({ ...r })),
    tcrAmounts: emptyTcrAmounts(),
    updatedAt: null,
  }
}

/** Copy structure from a source year, clearing all amounts. */
function yearDataFromPrevious(source) {
  if (!source) return blankYearData()
  const bilanRows =
    Array.isArray(source.bilanRows) && source.bilanRows.length
      ? source.bilanRows.map((row) => ({ ...row, amount: '' }))
      : blankYearData().bilanRows
  return {
    bilanRows,
    tcrAmounts: emptyTcrAmounts(),
    updatedAt: null,
  }
}

function pickTemplateYear(store, excludeYear) {
  if (store.activeYear && store.activeYear !== excludeYear && store.years[store.activeYear]) {
    return store.years[store.activeYear]
  }
  const keys = Object.keys(store.years)
    .filter((y) => y !== excludeYear)
    .sort((a, b) => Number(b) - Number(a) || String(b).localeCompare(String(a)))
  return keys.length ? store.years[keys[0]] : null
}

function isYearAmountsEmpty(data) {
  if (!data) return true
  const rows = Array.isArray(data.bilanRows) ? data.bilanRows : []
  const hasBilan = rows.some((r) => {
    const raw = String(r?.amount ?? '')
      .trim()
      .replace(/\s/g, '')
      .replace(',', '.')
    if (!raw) return false
    const num = Number(raw)
    return !Number.isNaN(num) && num !== 0
  })
  const tcr = data.tcrAmounts || {}
  const hasTcr = Object.values(tcr).some((v) => String(v ?? '').trim() !== '')
  return !hasBilan && !hasTcr
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

function requireCompany(userId, companyId) {
  const cid = companyId || getActiveCompanyId(userId)
  if (!cid) throw new Error('NO_COMPANY')
  return cid
}

export function listYears(userId, companyId) {
  const store = normalizeStore(readRaw(userId, companyId))
  return Object.keys(store.years).sort((a, b) => Number(b) - Number(a) || String(b).localeCompare(String(a)))
}

export function getActiveYear(userId, companyId) {
  return normalizeStore(readRaw(userId, companyId)).activeYear
}

export function setActiveYear(userId, year, companyId) {
  requireCompany(userId, companyId)
  const store = normalizeStore(readRaw(userId, companyId))
  const y = String(year).trim()
  if (!y) return store
  if (!store.years[y]) store.years[y] = yearDataFromPrevious(pickTemplateYear(store, y))
  store.activeYear = y
  writeRaw(userId, store, companyId)
  return store
}

export function addYear(userId, year, companyId, sourceData) {
  requireCompany(userId, companyId)
  const y = String(year).trim()
  if (!/^\d{4}$/.test(y)) throw new Error('INVALID_YEAR')
  const store = normalizeStore(readRaw(userId, companyId))
  const template = sourceData || pickTemplateYear(store, y)
  const existing = store.years[y]
  // Create new year, or re-seed an empty year that was created with defaults earlier.
  if (!existing || isYearAmountsEmpty(existing)) {
    store.years[y] = yearDataFromPrevious(template)
  }
  store.activeYear = y
  writeRaw(userId, store, companyId)
  return store
}

export function removeYear(userId, year, companyId) {
  requireCompany(userId, companyId)
  const store = normalizeStore(readRaw(userId, companyId))
  const y = String(year)
  const keys = Object.keys(store.years)
  if (keys.length <= 1 || !store.years[y]) return store
  delete store.years[y]
  if (store.activeYear === y) {
    store.activeYear = Object.keys(store.years).sort((a, b) => Number(b) - Number(a))[0]
  }
  writeRaw(userId, store, companyId)
  return store
}

export function loadFinancial(userId, year, companyId) {
  const cid = companyId || getActiveCompanyId(userId)
  if (!cid) {
    const y = String(year || currentYear())
    const blank = blankYearData()
    return {
      activeYear: y,
      years: [y],
      exerciseLabel: y,
      bilanRows: blank.bilanRows,
      tcrAmounts: blank.tcrAmounts,
      updatedAt: null,
      noCompany: true,
      companyId: null,
    }
  }

  const store = normalizeStore(readRaw(userId, cid))
  const y = String(year || store.activeYear)
  const data = store.years[y] || blankYearData()
  return {
    activeYear: y,
    years: Object.keys(store.years).sort((a, b) => Number(b) - Number(a)),
    exerciseLabel: y,
    bilanRows: data.bilanRows?.length ? data.bilanRows : blankYearData().bilanRows,
    tcrAmounts: { ...emptyTcrAmounts(), ...(data.tcrAmounts || {}) },
    updatedAt: data.updatedAt || null,
    noCompany: false,
    companyId: cid,
  }
}

export function saveFinancial(userId, patch, companyId) {
  const cid = requireCompany(userId, companyId)
  const store = normalizeStore(readRaw(userId, cid))
  const y = String(patch.exerciseLabel || patch.activeYear || store.activeYear)
  if (!store.years[y]) store.years[y] = blankYearData()
  const prev = store.years[y]
  store.years[y] = {
    bilanRows: patch.bilanRows ?? prev.bilanRows,
    tcrAmounts: patch.tcrAmounts ?? prev.tcrAmounts,
    updatedAt: new Date().toISOString(),
  }
  store.activeYear = y
  writeRaw(userId, store, cid)
  return loadFinancial(userId, y, cid)
}
