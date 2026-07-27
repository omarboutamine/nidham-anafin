/** Persist statistical analysis sessions per user/company in localStorage. */

function key(userId, companyId) {
  return `anafin_stats_sessions_${userId}_${companyId}`
}

export function listStatsSessions(userId, companyId) {
  try {
    const raw = localStorage.getItem(key(userId, companyId))
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveStatsSession(userId, companyId, session) {
  const list = listStatsSessions(userId, companyId)
  const entry = {
    id: `s_${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...session,
  }
  list.unshift(entry)
  localStorage.setItem(key(userId, companyId), JSON.stringify(list.slice(0, 30)))
  return entry
}

export function removeStatsSession(userId, companyId, sessionId) {
  const list = listStatsSessions(userId, companyId).filter((s) => s.id !== sessionId)
  localStorage.setItem(key(userId, companyId), JSON.stringify(list))
  return list
}
