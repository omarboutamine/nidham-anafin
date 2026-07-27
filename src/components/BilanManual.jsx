import { useEffect, useMemo, useState } from 'react'
import {
  BILAN_SECTIONS,
  formatMoney,
  n,
} from '../config/financialTemplates'
import {
  buildLabelPatch,
  healBilanRowLabels,
  resolveRowLabel,
} from '../config/labelI18n'
import { loadFinancial, saveFinancial } from '../services/financialStore'
import NeedCompanyNotice from './NeedCompanyNotice'
import YearToolbar from './YearToolbar'

function sectionLabel(section, lang) {
  return lang === 'ar' ? section.ar : section.fr
}

export default function BilanManual({ user, t, lang }) {
  const f = t.financial
  const [state, setState] = useState(() => {
    const loaded = loadFinancial(user.id)
    return {
      ...loaded,
      bilanRows: healBilanRowLabels(loaded.bilanRows, f.newLine),
    }
  })
  const [savedFlash, setSavedFlash] = useState(false)

  useEffect(() => {
    setState((prev) => {
      const healed = healBilanRowLabels(prev.bilanRows, f.newLine)
      const changed = healed.some((row, i) => row !== prev.bilanRows[i])
      return changed ? { ...prev, bilanRows: healed } : prev
    })
  }, [lang, f.newLine])

  const onYearChange = (year) => {
    const loaded = loadFinancial(user.id, year)
    setState({
      ...loaded,
      bilanRows: healBilanRowLabels(loaded.bilanRows, f.newLine),
    })
    setSavedFlash(false)
  }

  const persist = () => {
    const healed = healBilanRowLabels(state.bilanRows, f.newLine)
    const saved = saveFinancial(user.id, {
      exerciseLabel: state.activeYear || state.exerciseLabel,
      bilanRows: healed,
    })
    setState({
      ...saved,
      bilanRows: healBilanRowLabels(saved.bilanRows, f.newLine),
    })
    setSavedFlash(true)
    window.setTimeout(() => setSavedFlash(false), 1600)
  }

  const getYearTemplate = () => {
    const healed = healBilanRowLabels(state.bilanRows, f.newLine)
    const saved = saveFinancial(user.id, {
      exerciseLabel: state.activeYear || state.exerciseLabel,
      bilanRows: healed,
      tcrAmounts: state.tcrAmounts,
    })
    setState((prev) => ({
      ...prev,
      bilanRows: healBilanRowLabels(saved.bilanRows, f.newLine),
      tcrAmounts: saved.tcrAmounts,
      updatedAt: saved.updatedAt,
    }))
    return { bilanRows: saved.bilanRows, tcrAmounts: saved.tcrAmounts }
  }

  const updateRow = (id, patch) => {
    const bilanRows = state.bilanRows.map((r) => (r.id === id ? { ...r, ...patch } : r))
    setState((prev) => ({ ...prev, bilanRows }))
  }

  const updateLabel = (row, value) => {
    updateRow(row.id, buildLabelPatch(row, lang, value, f.newLine))
  }

  const addRow = (section) => {
    const id = `custom_${Date.now()}`
    const bilanRows = [
      ...state.bilanRows,
      {
        id,
        section,
        number: '',
        labelFr: 'Nouveau poste',
        labelAr: 'بند جديد',
        amount: '',
        custom: true,
      },
    ]
    setState((prev) => ({ ...prev, bilanRows }))
  }

  const removeRow = (id) => {
    const bilanRows = state.bilanRows.filter((r) => r.id !== id)
    setState((prev) => ({ ...prev, bilanRows }))
  }

  const totals = useMemo(() => {
    const bySection = {}
    for (const key of Object.keys(BILAN_SECTIONS)) bySection[key] = 0
    for (const row of state.bilanRows) {
      bySection[row.section] = (bySection[row.section] || 0) + n(row.amount)
    }
    const totalActif = bySection.actifNonCourant + bySection.actifCourant
    const totalPassif =
      bySection.capitauxPropres + bySection.passifNonCourant + bySection.passifCourant
    const gap = totalActif - totalPassif
    const balanced = Math.abs(gap) < 0.005
    const max = Math.max(totalActif, totalPassif, 1)
    return { bySection, totalActif, totalPassif, gap, balanced, max }
  }, [state.bilanRows])

  const renderSide = (side) => {
    const sections = Object.values(BILAN_SECTIONS)
      .filter((s) => s.side === side)
      .sort((a, b) => a.order - b.order)

    return (
      <div className={`fin-side fin-side--${side}`}>
        <h3 className="fin-side__title">{side === 'actif' ? f.actif : f.passif}</h3>
        {sections.map((sec) => {
          const rows = state.bilanRows.filter((r) => r.section === sec.key)
          return (
            <div key={sec.key} className="fin-section">
              <div className="fin-section__head">
                <h4>{sectionLabel(sec, lang)}</h4>
              </div>
              <table className="fin-table">
                <thead>
                  <tr>
                    <th>{f.colLabel}</th>
                    <th>{f.colAmount}</th>
                    <th aria-label={f.remove} />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <input
                          className="fin-input"
                          value={resolveRowLabel(row, lang, f.newLine)}
                          onChange={(e) => updateLabel(row, e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          className="fin-input fin-input--amount"
                          inputMode="decimal"
                          placeholder="0.00"
                          value={row.amount}
                          onChange={(e) => updateRow(row.id, { amount: e.target.value })}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="fin-icon-btn"
                          title={f.remove}
                          onClick={() => removeRow(row.id)}
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="fin-row-add">
                    <td colSpan={3}>
                      <button type="button" className="fin-add-btn" onClick={() => addRow(sec.key)}>
                        + {f.addLine}
                      </button>
                    </td>
                  </tr>
                  <tr className="fin-row-subtotal">
                    <td>
                      {f.subtotal} {sectionLabel(sec, lang)}
                    </td>
                    <td className="fin-amount">{formatMoney(totals.bySection[sec.key], lang)}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          )
        })}
        <div className="fin-total-bar">
          <span>{side === 'actif' ? f.totalActif : f.totalPassif}</span>
          <strong>{formatMoney(side === 'actif' ? totals.totalActif : totals.totalPassif, lang)}</strong>
        </div>
      </div>
    )
  }

  const balancePct = Math.min(100, (Math.min(totals.totalActif, totals.totalPassif) / totals.max) * 100)

  if (state.noCompany) {
    return <NeedCompanyNotice t={t} />
  }

  return (
    <section className="fin-panel">
      <header className="fin-panel__head">
        <div>
          <p className="fin-kicker">{f.manualMode}</p>
          <h2 className="fin-panel__title">{f.bilanTitle}</h2>
          <p className="fin-panel__lead">{f.bilanLead}</p>
        </div>
        <div className="fin-panel__tools">
          <YearToolbar
            userId={user.id}
            activeYear={state.activeYear || state.exerciseLabel}
            onYearChange={onYearChange}
            t={t}
            getYearTemplate={getYearTemplate}
            allowYearManage
          />
          <button type="button" className="btn btn-primary" onClick={persist}>
            {f.save}
          </button>
          {savedFlash && <span className="fin-saved">{f.saved}</span>}
        </div>
      </header>

      <div className={`fin-balance-meter ${totals.balanced ? 'is-ok' : 'is-off'}`}>
        <div className="fin-balance-meter__track">
          <div className="fin-balance-meter__fill" style={{ width: `${balancePct}%` }} />
        </div>
        <p className="fin-balance-meter__text">
          {totals.balanced
            ? f.balanced
            : `${f.imbalance}: ${formatMoney(totals.gap, lang)}`}
        </p>
      </div>

      <div className="fin-two-col">
        {renderSide('actif')}
        {renderSide('passif')}
      </div>
    </section>
  )
}
