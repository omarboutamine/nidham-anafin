import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import DashboardShell from '../components/DashboardShell'
import {
  accountsByClass,
  BILAN_CLASSIFICATIONS,
  isBilanClass,
  SCF_CLASS_TABS,
} from '../config/scfAccounts'
import { useLandingLang } from '../hooks/useLandingLang'
import {
  commitSelectionToEntries,
  getWorkingEntries,
  loadAnalysis,
  markTransferred,
  toggleAccountSelection,
  updateEntry,
} from '../services/analysisStore'
import { getSessionUser } from '../services/authStore'
import '../styles/landing-base.css'
import '../styles/landing-extra.css'
import '../styles/dashboard-app.css'

export default function ScfPage() {
  const { t, lang } = useLandingLang()
  const navigate = useNavigate()
  const user = getSessionUser()
  const d = t.dashboard
  const [activeClass, setActiveClass] = useState('1')
  const [tick, setTick] = useState(0)
  const [message, setMessage] = useState('')

  const classAccounts = useMemo(() => accountsByClass(activeClass), [activeClass])
  const state = user ? loadAnalysis(user.id) : { selectedNumbers: [], entries: {} }
  // tick forces re-read after mutations
  void tick
  const bilanRows = user ? getWorkingEntries(user.id, 'bilan') : []
  const tcrRows = user ? getWorkingEntries(user.id, 'tcr') : []

  if (!user) return <Navigate to="/login" replace />

  const refresh = () => setTick((n) => n + 1)
  const selectedInClass = classAccounts.filter((a) => state.selectedNumbers.includes(a.number)).length

  const handleToggle = (number) => {
    toggleAccountSelection(user.id, number)
    setMessage('')
    refresh()
  }

  const handleSave = () => {
    if (!state.selectedNumbers.length) {
      setMessage(d.scfNeedSelect)
      return
    }
    commitSelectionToEntries(user.id)
    setMessage(d.scfSaved)
    refresh()
  }

  const handleAmount = (number, value) => {
    updateEntry(user.id, number, { amount: value })
    refresh()
  }

  const handleClassif = (number, value) => {
    updateEntry(user.id, number, { classification: value })
    refresh()
  }

  const handleTransfer = () => {
    const current = loadAnalysis(user.id)
    const bilan = Object.values(current.entries).filter((e) => isBilanClass(e.number))
    const tcr = Object.values(current.entries).filter((e) => !isBilanClass(e.number))
    if (!bilan.length && !tcr.length) {
      setMessage(d.scfNeedBilan)
      return
    }
    const missingBilan = bilan.some((e) => e.amount === '' || e.amount == null)
    if (bilan.length && missingBilan) {
      setMessage(d.scfNeedAmounts)
      return
    }
    markTransferred(user.id)
    navigate(bilan.length ? '/dashboard/bilan' : '/dashboard/tcr')
  }

  const classLabel = (tab) => (lang === 'fr' ? tab.fr : tab.ar)
  const classifLabel = (opt) => (lang === 'fr' ? opt.fr : opt.ar)

  return (
    <DashboardShell title={d.scfTitle}>
      <p className="dash-lead dash-lead--tight">{d.scfIntro}</p>

      <div className="scf-tabs" role="tablist">
        {SCF_CLASS_TABS.map((tab) => (
          <button
            key={tab.digit}
            type="button"
            role="tab"
            aria-selected={activeClass === tab.digit}
            className={`scf-tab ${activeClass === tab.digit ? 'active' : ''}`}
            onClick={() => setActiveClass(tab.digit)}
          >
            {classLabel(tab)}
          </button>
        ))}
      </div>

      <section className="dash-panel">
        <div className="scf-toolbar">
          <p className="scf-toolbar-meta">
            {d.scfSelectedInClass}: <strong>{selectedInClass}</strong> — {d.scfSelectedTotal}:{' '}
            <strong>{state.selectedNumbers.length}</strong>
          </p>
          <button type="button" className="btn btn-primary btn-sm" onClick={handleSave}>
            {d.scfSave}
          </button>
        </div>

        <div className="scf-cards">
          {classAccounts.map((acc) => {
            const selected = state.selectedNumbers.includes(acc.number)
            return (
              <button
                key={acc.number}
                type="button"
                className={`scf-card ${selected ? 'is-selected' : ''}`}
                onClick={() => handleToggle(acc.number)}
                aria-pressed={selected}
              >
                <span className="scf-card-number">{acc.number}</span>
                <span className="scf-card-name">{acc.name}</span>
              </button>
            )
          })}
        </div>
      </section>

      {message && (
        <p className="scf-message" role="status">
          {message}
        </p>
      )}

      {bilanRows.length > 0 && (
        <section className="dash-panel">
          <div className="scf-table-head">
            <h2 className="dash-panel-title">{d.scfBilanTableTitle}</h2>
            <button type="button" className="btn btn-primary btn-sm" onClick={handleTransfer}>
              {d.scfTransfer}
            </button>
          </div>
          <div className="scf-table-wrap">
            <table className="scf-table">
              <thead>
                <tr>
                  <th>{d.colAccountNo}</th>
                  <th>{d.colAccountName}</th>
                  <th>{d.colClassification}</th>
                  <th>{d.colAmount}</th>
                </tr>
              </thead>
              <tbody>
                {bilanRows.map((row) => (
                  <tr key={row.number}>
                    <td>{row.number}</td>
                    <td>{row.name}</td>
                    <td>
                      <select
                        className="scf-select"
                        value={row.classification || ''}
                        onChange={(e) => handleClassif(row.number, e.target.value)}
                      >
                        <option value="">{d.colClassificationPick}</option>
                        {BILAN_CLASSIFICATIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {classifLabel(opt)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        className="scf-amount"
                        type="number"
                        inputMode="decimal"
                        value={row.amount}
                        onChange={(e) => handleAmount(row.number, e.target.value)}
                        placeholder="0"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tcrRows.length > 0 && (
        <section className="dash-panel">
          <h2 className="dash-panel-title">{d.scfTcrTableTitle}</h2>
          <p className="dash-workspace-empty">{d.scfTcrHint}</p>
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
                {tcrRows.map((row) => (
                  <tr key={row.number}>
                    <td>{row.number}</td>
                    <td>{row.name}</td>
                    <td>
                      <input
                        className="scf-amount"
                        type="number"
                        inputMode="decimal"
                        value={row.amount}
                        onChange={(e) => handleAmount(row.number, e.target.value)}
                        placeholder="0"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" className="btn btn-primary btn-sm scf-transfer-tcr" onClick={handleTransfer}>
            {d.scfTransfer}
          </button>
        </section>
      )}
    </DashboardShell>
  )
}
