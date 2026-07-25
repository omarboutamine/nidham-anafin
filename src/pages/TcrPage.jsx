import { Navigate } from 'react-router-dom'
import DashboardShell from '../components/DashboardShell'
import { accountClassDigit } from '../config/scfAccounts'
import { useLandingLang } from '../hooks/useLandingLang'
import { getTcrEntries } from '../services/analysisStore'
import { getSessionUser } from '../services/authStore'
import '../styles/landing-base.css'
import '../styles/landing-extra.css'
import '../styles/dashboard-app.css'

function formatAmount(value) {
  const n = Number(value)
  if (Number.isNaN(n)) return value || '—'
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

export default function TcrPage() {
  const { t } = useLandingLang()
  const user = getSessionUser()
  const d = t.dashboard

  if (!user) return <Navigate to="/login" replace />

  const rows = getTcrEntries(user.id)
  const charges = rows.filter((r) => accountClassDigit(r.number) === '6')
  const produits = rows.filter((r) => accountClassDigit(r.number) === '7')
  const totalCharges = charges.reduce((s, r) => s + (Number(r.amount) || 0), 0)
  const totalProduits = produits.reduce((s, r) => s + (Number(r.amount) || 0), 0)
  const resultat = totalProduits - totalCharges

  const renderBlock = (title, list, total) => (
    <section className="dash-panel">
      <div className="scf-table-head">
        <h2 className="dash-panel-title">{title}</h2>
        <strong className="bilan-total">{formatAmount(total)}</strong>
      </div>
      {!list.length ? (
        <p className="dash-workspace-empty">{d.tcrBlockEmpty}</p>
      ) : (
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
              {list.map((row) => (
                <tr key={row.number}>
                  <td>{row.number}</td>
                  <td>{row.name}</td>
                  <td>{formatAmount(row.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )

  return (
    <DashboardShell title="TCR">
      <p className="dash-lead dash-lead--tight">{d.tcrIntro}</p>

      {!rows.length ? (
        <section className="dash-panel dash-panel--muted">
          <p className="dash-workspace-empty">{d.tcrEmpty}</p>
        </section>
      ) : (
        <>
          {renderBlock(d.tcrCharges, charges, totalCharges)}
          {renderBlock(d.tcrProduits, produits, totalProduits)}
          <section className="dash-panel dash-panel--result">
            <div className="scf-table-head">
              <h2 className="dash-panel-title">{d.tcrResult}</h2>
              <strong className={`bilan-total ${resultat < 0 ? 'is-neg' : 'is-pos'}`}>
                {formatAmount(resultat)}
              </strong>
            </div>
          </section>
        </>
      )}
    </DashboardShell>
  )
}
