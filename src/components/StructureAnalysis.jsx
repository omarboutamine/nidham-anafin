import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BILAN_SECTIONS, formatMoney, n } from '../config/financialTemplates'
import { buildStructureMetricInfo } from '../config/structureMetricReadings'
import { useLandingLang } from '../hooks/useLandingLang'
import { loadFinancial } from '../services/financialStore'
import MetricInfo from './MetricInfo'
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

function MetricHeading({ title, info, closeLabel, as = 'h3', className = '' }) {
  const Tag = as
  return (
    <Tag className={`analysis-heading-with-info ${className}`.trim()}>
      {title}
      <MetricInfo
        title={title}
        explanation={info.explanation}
        cases={info.cases}
        verdict={info.verdict}
        sectionLabels={info.sections}
        closeLabel={closeLabel}
      />
    </Tag>
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

  const infos = useMemo(
    () => ({
      overview: buildStructureMetricInfo('overview', metrics, lang),
      totalActif: buildStructureMetricInfo('totalActif', metrics, lang),
      totalPassif: buildStructureMetricInfo('totalPassif', metrics, lang),
      treasuryNet: buildStructureMetricInfo('treasuryNet', metrics, lang),
      actifStructure: buildStructureMetricInfo('actifStructure', metrics, lang),
      passifStructure: buildStructureMetricInfo('passifStructure', metrics, lang),
      liquidity: buildStructureMetricInfo('liquidity', metrics, lang),
      frng: buildStructureMetricInfo('frng', metrics, lang),
      bfr: buildStructureMetricInfo('bfr', metrics, lang),
    }),
    [metrics, lang],
  )

  if (state.noCompany) {
    return <NeedCompanyNotice t={t} />
  }

  return (
    <section className="analysis-page">
      <header className="analysis-page__head">
        <div className="analysis-page__top">
          <div className="analysis-page__intro">
            <p className="fin-kicker">{a.kicker}</p>
            <MetricHeading
              as="h1"
              className="analysis-page__title"
              title={a.title}
              info={infos.overview}
              closeLabel={a.infoClose}
            />
          </div>
          <Link to="/dashboard/analyse-lecture-approfondie?scope=structure" className="deep-reading-cta">
            {a.deepReadingCta}
          </Link>
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
              <span className="analysis-kpi__title">
                {a.totalActif}
                <MetricInfo
                  title={a.totalActif}
                  explanation={infos.totalActif.explanation}
                  cases={infos.totalActif.cases}
                  verdict={infos.totalActif.verdict}
                  sectionLabels={infos.totalActif.sections}
                  closeLabel={a.infoClose}
                />
              </span>
              <strong>{formatMoney(metrics.totalActif, lang)}</strong>
            </article>
            <article className="analysis-kpi">
              <span className="analysis-kpi__title">
                {a.totalPassif}
                <MetricInfo
                  title={a.totalPassif}
                  explanation={infos.totalPassif.explanation}
                  cases={infos.totalPassif.cases}
                  verdict={infos.totalPassif.verdict}
                  sectionLabels={infos.totalPassif.sections}
                  closeLabel={a.infoClose}
                />
              </span>
              <strong>{formatMoney(metrics.totalPassif, lang)}</strong>
            </article>
            <article className="analysis-kpi analysis-kpi--accent">
              <span className="analysis-kpi__title">
                {a.treasuryNet}
                <MetricInfo
                  title={a.treasuryNet}
                  explanation={infos.treasuryNet.explanation}
                  cases={infos.treasuryNet.cases}
                  verdict={infos.treasuryNet.verdict}
                  sectionLabels={infos.treasuryNet.sections}
                  closeLabel={a.infoClose}
                />
              </span>
              <strong className={metrics.tresorerie >= 0 ? 'is-pos' : 'is-neg'}>
                {formatMoney(metrics.tresorerie, lang)}
              </strong>
            </article>
          </div>

          <div className="analysis-structure">
            <article className="analysis-structure__panel">
              <MetricHeading title={a.actifStructure} info={infos.actifStructure} closeLabel={a.infoClose} />
              <Meter value={metrics.shareCourant} label={`${a.actifCourantShare}: ${metrics.shareCourant.toFixed(1)} %`} />
              <Meter
                value={metrics.shareNonCourant}
                label={`${a.actifNonCourantShare}: ${metrics.shareNonCourant.toFixed(1)} %`}
              />
            </article>
            <article className="analysis-structure__panel">
              <MetricHeading title={a.passifStructure} info={infos.passifStructure} closeLabel={a.infoClose} />
              <Meter value={metrics.shareEquity} label={`${a.equityShare}: ${metrics.shareEquity.toFixed(1)} %`} />
              <Meter value={metrics.shareDebt} label={`${a.debtShare}: ${metrics.shareDebt.toFixed(1)} %`} />
            </article>
          </div>

          <div className="analysis-grid analysis-grid--three">
            <article className="analysis-card">
              <MetricHeading title={a.liquidity} info={infos.liquidity} closeLabel={a.infoClose} />
              <p className="analysis-card__value">
                {metrics.liquidity == null ? '—' : metrics.liquidity.toFixed(2)}
              </p>
            </article>
            <article className="analysis-card">
              <MetricHeading title={a.frng} info={infos.frng} closeLabel={a.infoClose} />
              <p className={`analysis-card__value ${metrics.frng >= 0 ? 'is-pos' : 'is-neg'}`}>
                {formatMoney(metrics.frng, lang)}
              </p>
            </article>
            <article className="analysis-card">
              <MetricHeading title={a.bfr} info={infos.bfr} closeLabel={a.infoClose} />
              <p className={`analysis-card__value ${metrics.bfr >= 0 ? 'is-pos' : 'is-neg'}`}>
                {formatMoney(metrics.bfr, lang)}
              </p>
            </article>
          </div>
        </div>
      )}
    </section>
  )
}
