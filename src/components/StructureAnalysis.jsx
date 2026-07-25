import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BILAN_SECTIONS, formatMoney, n } from '../config/financialTemplates'
import { loadFinancial } from '../services/financialStore'
import YearToolbar from './YearToolbar'

function pct(part, total) {
  if (!total) return 0
  return (part / total) * 100
}

export default function StructureAnalysis({ user, t, lang }) {
  const d = t.dashboard
  const a = t.analysis
  const [state, setState] = useState(() => loadFinancial(user.id))
  const year = state.activeYear || state.exerciseLabel

  const metrics = useMemo(() => {
    const bySection = {}
    for (const key of Object.keys(BILAN_SECTIONS)) bySection[key] = 0
    for (const row of state.bilanRows || []) {
      bySection[row.section] = (bySection[row.section] || 0) + n(row.amount)
    }
    const actifCourant = bySection.actifCourant
    const actifNonCourant = bySection.actifNonCourant
    const totalActif = actifCourant + actifNonCourant
    const passifCourant = bySection.passifCourant
    const passifNonCourant = bySection.passifNonCourant
    const capitaux = bySection.capitauxPropres
    const totalPassif = passifCourant + passifNonCourant + capitaux
    const frng = capitaux + passifNonCourant - actifNonCourant
    const bfr = actifCourant - passifCourant
    const tresorerie = frng - bfr

    return {
      totalActif,
      totalPassif,
      shareCourant: pct(actifCourant, totalActif),
      shareNonCourant: pct(actifNonCourant, totalActif),
      shareEquity: pct(capitaux, totalPassif),
      liquidity: passifCourant ? actifCourant / passifCourant : null,
      frng,
      bfr,
      tresorerie,
      empty: totalActif === 0 && totalPassif === 0,
    }
  }, [state])

  const cards = [
    {
      key: 'courant',
      label: a.actifCourantShare,
      value: `${metrics.shareCourant.toFixed(1)} %`,
      hint: a.actifCourantHint,
    },
    {
      key: 'nonCourant',
      label: a.actifNonCourantShare,
      value: `${metrics.shareNonCourant.toFixed(1)} %`,
      hint: a.actifNonCourantHint,
    },
    {
      key: 'equity',
      label: a.equityShare,
      value: `${metrics.shareEquity.toFixed(1)} %`,
      hint: a.equityHint,
    },
    {
      key: 'liquidity',
      label: a.liquidity,
      value: metrics.liquidity == null ? '—' : metrics.liquidity.toFixed(2),
      hint: a.liquidityHint,
    },
    {
      key: 'frng',
      label: a.frng,
      value: formatMoney(metrics.frng, lang),
      hint: a.frngHint,
    },
    {
      key: 'bfr',
      label: a.bfr,
      value: formatMoney(metrics.bfr, lang),
      hint: a.bfrHint,
    },
  ]

  return (
    <section className="analysis-page">
      <header className="analysis-page__head">
        <div className="analysis-page__intro">
          <p className="fin-kicker">{a.kicker}</p>
          <h1 className="analysis-page__title">{a.title}</h1>
          <p className="analysis-page__lead">{a.lead}</p>
        </div>
        <div className="analysis-page__tools">
          <YearToolbar
            userId={user.id}
            activeYear={year}
            onYearChange={(nextYear) => setState(loadFinancial(user.id, nextYear))}
            t={t}
          />
        </div>
      </header>

      {metrics.empty ? (
        <div className="dash-empty-state">
          <p>{a.empty}</p>
          <Link to="/dashboard/bilan" className="btn btn-primary">
            {d.bilan}
          </Link>
        </div>
      ) : (
        <div className="analysis-stage">
          <div className="analysis-summary">
            <article className="analysis-summary__card">
              <span>{a.totalActif}</span>
              <strong>{formatMoney(metrics.totalActif, lang)}</strong>
            </article>
            <article className="analysis-summary__card">
              <span>{a.totalPassif}</span>
              <strong>{formatMoney(metrics.totalPassif, lang)}</strong>
            </article>
            <article className="analysis-summary__card">
              <span>{a.treasuryNet}</span>
              <strong className={metrics.tresorerie >= 0 ? 'is-pos' : 'is-neg'}>
                {formatMoney(metrics.tresorerie, lang)}
              </strong>
            </article>
          </div>

          <div className="analysis-grid">
            {cards.map((card) => (
              <article key={card.key} className="analysis-card">
                <h3>{card.label}</h3>
                <p className="analysis-card__value">{card.value}</p>
                <p className="analysis-card__hint">{card.hint}</p>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
