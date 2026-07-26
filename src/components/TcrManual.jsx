import { Fragment, useMemo, useState } from 'react'
import { computeTcr, formatMoney, TCR_INPUTS } from '../config/financialTemplates'
import { loadFinancial, saveFinancial } from '../services/financialStore'
import NeedCompanyNotice from './NeedCompanyNotice'
import YearToolbar from './YearToolbar'

function inputLabel(row, lang) {
  return lang === 'ar' ? row.labelAr : row.labelFr
}

export default function TcrManual({ user, t, lang }) {
  const f = t.financial
  const [state, setState] = useState(() => loadFinancial(user.id))
  const [savedFlash, setSavedFlash] = useState(false)

  const onYearChange = (year) => {
    setState(loadFinancial(user.id, year))
    setSavedFlash(false)
  }

  const computed = useMemo(() => computeTcr(state.tcrAmounts), [state.tcrAmounts])

  const setAmount = (id, value) => {
    setState((prev) => ({
      ...prev,
      tcrAmounts: { ...prev.tcrAmounts, [id]: value },
    }))
  }

  const persist = () => {
    const saved = saveFinancial(user.id, {
      exerciseLabel: state.activeYear || state.exerciseLabel,
      tcrAmounts: state.tcrAmounts,
    })
    setState(saved)
    setSavedFlash(true)
    window.setTimeout(() => setSavedFlash(false), 1600)
  }

  const lines = [
    {
      id: '1',
      kind: 'group',
      label: f.tcr1,
      value: computed.production,
      children: TCR_INPUTS.filter((r) => r.group === 'production'),
    },
    {
      id: '2',
      kind: 'group',
      label: f.tcr2,
      value: computed.consommation,
      children: TCR_INPUTS.filter((r) => r.group === 'consommation'),
    },
    { id: '3', kind: 'subtotal', label: f.tcr3, value: computed.va },
    {
      id: '4',
      kind: 'group',
      label: f.tcr4,
      value: computed.ebe,
      children: TCR_INPUTS.filter((r) => r.group === 'ebe'),
    },
    {
      id: '5',
      kind: 'group',
      label: f.tcr5,
      value: computed.exploitation,
      children: TCR_INPUTS.filter((r) => r.group === 'exploitation'),
    },
    {
      id: '6',
      kind: 'group',
      label: f.tcr6,
      value: computed.financier,
      children: TCR_INPUTS.filter((r) => r.group === 'financier'),
    },
    { id: '7', kind: 'subtotal', label: f.tcr7, value: computed.ordinaire },
    {
      id: '8',
      kind: 'group',
      label: f.tcr8,
      value: computed.netOrdinaire,
      children: TCR_INPUTS.filter((r) => r.group === 'impots'),
    },
    {
      id: '9',
      kind: 'group',
      label: f.tcr9,
      value: computed.extra,
      children: TCR_INPUTS.filter((r) => r.group === 'extra'),
    },
    { id: '10', kind: 'total', label: f.tcr10, value: computed.net },
  ]

  if (state.noCompany) {
    return <NeedCompanyNotice t={t} />
  }

  return (
    <section className="fin-panel">
      <header className="fin-panel__head">
        <div>
          <p className="fin-kicker">{f.manualMode}</p>
          <h2 className="fin-panel__title">{f.tcrTitle}</h2>
          <p className="fin-panel__lead">{f.tcrLead}</p>
        </div>
        <div className="fin-panel__tools">
          <YearToolbar
            userId={user.id}
            activeYear={state.activeYear || state.exerciseLabel}
            onYearChange={onYearChange}
            t={t}
          />
          <button type="button" className="btn btn-primary" onClick={persist}>
            {f.save}
          </button>
          {savedFlash && <span className="fin-saved">{f.saved}</span>}
        </div>
      </header>

      <div className="fin-tcr-result-chip">
        <span>{f.tcr10}</span>
        <strong className={computed.net >= 0 ? 'is-pos' : 'is-neg'}>
          {formatMoney(computed.net, lang)}
        </strong>
      </div>

      <table className="fin-table fin-table--tcr">
        <thead>
          <tr>
            <th>{f.colLabel}</th>
            <th>{f.exerciceN}</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <Fragment key={line.id}>
              <tr className={`fin-tcr-row fin-tcr-row--${line.kind}`}>
                <td>
                  <span className="fin-tcr-id">{line.id}.</span> {line.label}
                </td>
                <td className="fin-amount fin-amount--computed">{formatMoney(line.value, lang)}</td>
              </tr>
              {line.children?.map((child) => (
                <tr key={child.id} className="fin-tcr-row fin-tcr-row--input">
                  <td className="fin-tcr-child">{inputLabel(child, lang)}</td>
                  <td>
                    <input
                      className="fin-input fin-input--amount"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={state.tcrAmounts[child.id] ?? ''}
                      onChange={(e) => setAmount(child.id, e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </section>
  )
}
