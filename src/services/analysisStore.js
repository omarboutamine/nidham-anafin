import {
  defaultClassificationForAccount,
  findAccount,
  isBilanClass,
  isTcrClass,
} from '../config/scfAccounts'

function storageKey(userId) {
  return `anafin_analysis_${userId}`
}

function emptyState() {
  return {
    selectedNumbers: [],
    entries: {}, // number -> { classification, amount }
    transferred: false,
    updatedAt: null,
  }
}

export function loadAnalysis(userId) {
  if (!userId) return emptyState()
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return emptyState()
    return { ...emptyState(), ...JSON.parse(raw) }
  } catch {
    return emptyState()
  }
}

export function saveAnalysis(userId, state) {
  const next = { ...state, updatedAt: new Date().toISOString() }
  localStorage.setItem(storageKey(userId), JSON.stringify(next))
  return next
}

export function toggleAccountSelection(userId, accountNumber) {
  const state = loadAnalysis(userId)
  const num = String(accountNumber)
  const set = new Set(state.selectedNumbers)
  if (set.has(num)) set.delete(num)
  else set.add(num)
  return saveAnalysis(userId, { ...state, selectedNumbers: [...set].sort() })
}

/** Persist selected accounts into editable entries (1–5 + 6–7). */
export function commitSelectionToEntries(userId) {
  const state = loadAnalysis(userId)
  const entries = { ...state.entries }
  for (const num of state.selectedNumbers) {
    if (entries[num]) continue
    const acc = findAccount(num)
    if (!acc) continue
    entries[num] = {
      number: num,
      name: acc.name,
      classification: isBilanClass(num) ? defaultClassificationForAccount(num) : '',
      amount: '',
    }
  }
  // Drop entries no longer selected
  for (const key of Object.keys(entries)) {
    if (!state.selectedNumbers.includes(key)) delete entries[key]
  }
  return saveAnalysis(userId, { ...state, entries, transferred: false })
}

export function updateEntry(userId, accountNumber, patch) {
  const state = loadAnalysis(userId)
  const num = String(accountNumber)
  const prev = state.entries[num]
  if (!prev) return state
  const nextEntry = { ...prev, ...patch }
  if (!isBilanClass(num)) nextEntry.classification = ''
  return saveAnalysis(userId, {
    ...state,
    entries: { ...state.entries, [num]: nextEntry },
    transferred: false,
  })
}

export function markTransferred(userId) {
  const state = loadAnalysis(userId)
  return saveAnalysis(userId, { ...state, transferred: true })
}

export function getBilanEntries(userId) {
  const state = loadAnalysis(userId)
  if (!state.transferred) return []
  return Object.values(state.entries)
    .filter((e) => isBilanClass(e.number))
    .sort((a, b) => String(a.number).localeCompare(String(b.number), 'en', { numeric: true }))
}

export function getTcrEntries(userId) {
  const state = loadAnalysis(userId)
  if (!state.transferred) return []
  return Object.values(state.entries)
    .filter((e) => isTcrClass(e.number))
    .sort((a, b) => String(a.number).localeCompare(String(b.number), 'en', { numeric: true }))
}

export function getWorkingEntries(userId, kind) {
  const state = loadAnalysis(userId)
  const list = Object.values(state.entries)
  const filtered =
    kind === 'bilan'
      ? list.filter((e) => isBilanClass(e.number))
      : list.filter((e) => isTcrClass(e.number))
  return filtered.sort((a, b) =>
    String(a.number).localeCompare(String(b.number), 'en', { numeric: true }),
  )
}
