import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BILAN_SECTIONS, formatMoney, n } from '../config/financialTemplates'
import { useLandingLang } from '../hooks/useLandingLang'
import { loadFinancial } from '../services/financialStore'
import NeedCompanyNotice from './NeedCompanyNotice'
import YearToolbar from './YearToolbar'

function pct(part, total) {
  if (!total) return 0
  return (part / total) * 100
}

function Meter({ value, label }) {
  const width = Math.max(0, Math.min(100, value))
  return (
    <div className="analysis-meter">
      <div className="analysis-meter__track">
        <div className="analysis-meter__fill" style={{ width: `${width}%` }} />
      </div>
      <span className="analysis-meter__label">{label}</span>
    </div>
  )
}

export default function StructureAnalysis({ user }) {
  const { t, lang } = useLandingLang()
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
      actifCourant,
      actifNonCourant,
      passifCourant,
      passifNonCourant,
      capitaux,
      shareCourant: pct(actifCourant, totalActif),
      shareNonCourant: pct(actifNonCourant, totalActif),
      shareEquity: pct(capitaux, totalPassif),
      shareDebt: pct(passifCourant + passifNonCourant, totalPassif),
      liquidity: passifCourant ? actifCourant / passifCourant : null,
      frng,
      bfr,
      tresorerie,
      empty: totalActif === 0 && totalPassif === 0,
    }
  }, [state])

  if (state.noCompany) {
    return <NeedCompanyNotice t={t} />
  }

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
          <div className="analysis-hero-strip">
            <article className="analysis-kpi">
              <span>{a.totalActif}</span>
              <strong>{formatMoney(metrics.totalActif, lang)}</strong>
            </article>
            <article className="analysis-kpi">
              <span>{a.totalPassif}</span>
              <strong>{formatMoney(metrics.totalPassif, lang)}</strong>
            </article>
            <article className="analysis-kpi analysis-kpi--accent">
              <span>{a.treasuryNet}</span>
              <strong className={metrics.tresorerie >= 0 ? 'is-pos' : 'is-neg'}>
                {formatMoney(metrics.tresorerie, lang)}
              </strong>
            </article>
          </div>

          <div className="analysis-structure">
            <article className="analysis-structure__panel">
              <h3>{a.actifStructure}</h3>
              <Meter value={metrics.shareCourant} label={`${a.actifCourantShare}: ${metrics.shareCourant.toFixed(1)} %`} />
              <Meter
                value={metrics.shareNonCourant}
                label={`${a.actifNonCourantShare}: ${metrics.shareNonCourant.toFixed(1)} %`}
              />
              <p className="analysis-structure__note">{a.actifStructureNote}</p>
            </article>
            <article className="analysis-structure__panel">
              <h3>{a.passifStructure}</h3>
              <Meter value={metrics.shareEquity} label={`${a.equityShare}: ${metrics.shareEquity.toFixed(1)} %`} />
              <Meter value={metrics.shareDebt} label={`${a.debtShare}: ${metrics.shareDebt.toFixed(1)} %`} />
              <p className="analysis-structure__note">{a.passifStructureNote}</p>
            </article>
          </div>

          <div className="analysis-grid analysis-grid--three">
            <article className="analysis-card">
              <h3>{a.liquidity}</h3>
              <p className="analysis-card__value">
                {metrics.liquidity == null ? '—' : metrics.liquidity.toFixed(2)}
              </p>
              <p className="analysis-card__hint">{a.liquidityHint}</p>
            </article>
            <article className="analysis-card">
              <h3>{a.frng}</h3>
              <p className={`analysis-card__value ${metrics.frng >= 0 ? 'is-pos' : 'is-neg'}`}>
                {formatMoney(metrics.frng, lang)}
              </p>
              <p className="analysis-card__hint">{a.frngHint}</p>
            </article>
            <article className="analysis-card">
              <h3>{a.bfr}</h3>
              <p className={`analysis-card__value ${metrics.bfr >= 0 ? 'is-pos' : 'is-neg'}`}>
                {formatMoney(metrics.bfr, lang)}
              </p>
              <p className="analysis-card__hint">{a.bfrHint}</p>
            </article>
          </div>
        </div>
      )}
    </section>
  )
}
