const keyFor = (userId) => `anafin_companies_${userId}`
const LEGACY_FINANCIAL_PREFIX = 'anafin_financial_'

function makeId() {
  if (crypto.randomUUID) return crypto.randomUUID()
  return `c_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
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

function notifyCompanyChanged() {
  try {
    window.dispatchEvent(new CustomEvent('anafin:company-changed'))
  } catch {
    /* ignore */
  }
}

function normalizeStore(stored) {
  if (!stored || typeof stored !== 'object') {
    return { activeCompanyId: null, companies: [] }
  }
  const companies = Array.isArray(stored.companies) ? stored.companies.filter((c) => c && c.id && c.name) : []
  let activeCompanyId = stored.activeCompanyId || null
  if (activeCompanyId && !companies.some((c) => c.id === activeCompanyId)) {
    activeCompanyId = companies[0]?.id || null
  }
  if (!activeCompanyId && companies.length) activeCompanyId = companies[0].id
  return { activeCompanyId, companies }
}

function financialKey(userId, companyId) {
  return `${LEGACY_FINANCIAL_PREFIX}${userId}_${companyId}`
}

/** Move pre-company financial blob onto the first created company once. */
function migrateLegacyFinancial(userId, companyId) {
  const legacyKey = `${LEGACY_FINANCIAL_PREFIX}${userId}`
  const targetKey = financialKey(userId, companyId)
  try {
    const legacy = localStorage.getItem(legacyKey)
    if (!legacy || localStorage.getItem(targetKey)) return
    localStorage.setItem(targetKey, legacy)
    localStorage.removeItem(legacyKey)
  } catch {
    /* ignore */
  }
}

export function listCompanies(userId) {
  return normalizeStore(readRaw(userId)).companies
}

export function getActiveCompanyId(userId) {
  return normalizeStore(readRaw(userId)).activeCompanyId
}

export function getActiveCompany(userId) {
  const store = normalizeStore(readRaw(userId))
  return store.companies.find((c) => c.id === store.activeCompanyId) || null
}

export function setActiveCompany(userId, companyId) {
  const store = normalizeStore(readRaw(userId))
  if (!store.companies.some((c) => c.id === companyId)) return store
  store.activeCompanyId = companyId
  writeRaw(userId, store)
  notifyCompanyChanged()
  return store
}

export function addCompany(userId, profile) {
  const name = String(profile?.name || '').trim()
  if (!name) throw new Error('NAME_REQUIRED')

  const store = normalizeStore(readRaw(userId))
  const company = {
    id: makeId(),
    name,
    legalForm: String(profile.legalForm || '').trim(),
    nif: String(profile.nif || '').trim(),
    nis: String(profile.nis || '').trim(),
    rc: String(profile.rc || '').trim(),
    capitalSocial: String(profile.capitalSocial || '').trim(),
    activity: String(profile.activity || '').trim(),
    wilaya: String(profile.wilaya || '').trim(),
    address: String(profile.address || '').trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const isFirst = store.companies.length === 0
  store.companies.push(company)
  store.activeCompanyId = company.id
  writeRaw(userId, store)

  if (isFirst) migrateLegacyFinancial(userId, company.id)

  notifyCompanyChanged()
  return company
}

export function updateCompany(userId, companyId, patch) {
  const store = normalizeStore(readRaw(userId))
  const idx = store.companies.findIndex((c) => c.id === companyId)
  if (idx < 0) throw new Error('NOT_FOUND')

  const prev = store.companies[idx]
  const name = patch.name !== undefined ? String(patch.name).trim() : prev.name
  if (!name) throw new Error('NAME_REQUIRED')

  store.companies[idx] = {
    ...prev,
    name,
    legalForm: patch.legalForm !== undefined ? String(patch.legalForm).trim() : prev.legalForm,
    nif: patch.nif !== undefined ? String(patch.nif).trim() : prev.nif,
    nis: patch.nis !== undefined ? String(patch.nis).trim() : prev.nis,
    rc: patch.rc !== undefined ? String(patch.rc).trim() : prev.rc,
    capitalSocial:
      patch.capitalSocial !== undefined ? String(patch.capitalSocial).trim() : prev.capitalSocial,
    activity: patch.activity !== undefined ? String(patch.activity).trim() : prev.activity,
    wilaya: patch.wilaya !== undefined ? String(patch.wilaya).trim() : prev.wilaya,
    address: patch.address !== undefined ? String(patch.address).trim() : prev.address,
    updatedAt: new Date().toISOString(),
  }
  writeRaw(userId, store)
  notifyCompanyChanged()
  return store.companies[idx]
}

export function removeCompany(userId, companyId) {
  const store = normalizeStore(readRaw(userId))
  const exists = store.companies.some((c) => c.id === companyId)
  if (!exists) return store

  store.companies = store.companies.filter((c) => c.id !== companyId)
  if (store.activeCompanyId === companyId) {
    store.activeCompanyId = store.companies[0]?.id || null
  }
  writeRaw(userId, store)

  try {
    localStorage.removeItem(financialKey(userId, companyId))
  } catch {
    /* ignore */
  }

  notifyCompanyChanged()
  return store
}

export function financialStorageKey(userId, companyId) {
  if (!userId || !companyId) return null
  return financialKey(userId, companyId)
}
