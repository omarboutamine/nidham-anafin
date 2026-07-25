import { Navigate } from 'react-router-dom'
import DashboardShell from '../components/DashboardShell'
import { BILAN_CLASSIFICATIONS } from '../config/scfAccounts'
import { useLandingLang } from '../hooks/useLandingLang'
import { getBilanEntries } from '../services/analysisStore'
import { getSessionUser } from '../services/authStore'
import '../styles/landing-base.css'
import '../styles/landing-extra.css'
import '../styles/dashboard-app.css'

function formatAmount(value) {
  const n = Number(value)
  if (Number.isNaN(n)) return value || '—'
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

export default function BilanPage() {
  const { t, lang } = useLandingLang()
  const user = getSessionUser()
  const d = t.dashboard

  if (!user) return <Navigate to="/login" replace />

  const rows = getBilanEntries(user.id)
  const labelOf = (value) => {
    const opt = BILAN_CLASSIFICATIONS.find((o) => o.value === value)
    if (!opt) return '—'
    return lang === 'fr' ? opt.fr : opt.ar
  }

  const groups = BILAN_CLASSIFICATIONS.map((opt) => ({
    ...opt,
    rows: rows.filter((r) => r.classification === opt.value),
    total: rows
      .filter((r) => r.classification === opt.value)
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0),
  })).filter((g) => g.rows.length > 0)

  return (
    <DashboardShell title={d.navBilan}>
      <p className="dash-lead dash-lead--tight">{d.bilanIntro}</p>

      {!rows.length ? (
        <section className="dash-panel dash-panel--muted">
          <p className="dash-workspace-empty">{d.bilanEmpty}</p>
        </section>
      ) : (
        groups.map((group) => (
          <section key={group.value} className="dash-panel">
            <div className="scf-table-head">
              <h2 className="dash-panel-title">{labelOf(group.value)}</h2>
              <strong className="bilan-total">{formatAmount(group.total)}</strong>
            </div>
            <div className="scf-table-wrap">
              <table className="scf-table">
                <thead>
                  <tr>
                    <th>{d.colAccountNo}</th>
                    <th>{d.colAccountName}</th>
                    <th>{d.colAmount}</th>
                  </tr>
                </thead>
                <tbody>
                  {group.rows.map((row) => (
                    <tr key={row.number}>
                      <td>{row.number}</td>
                      <td>{row.name}</td>
                      <td>{formatAmount(row.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}
    </DashboardShell>
  )
}
