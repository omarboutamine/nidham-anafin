import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatMoney } from '../config/financialTemplates'
import { buildMarketMetricInfo } from '../config/marketMetricReadings'
import { useLandingLang } from '../hooks/useLandingLang'
import {
  ANALYSIS_MODULES,
  computeFundamentals,
  formatRatio,
  interpretConan,
} from '../services/analysisEngine'
import { listYears, loadFinancial } from '../services/financialStore'
import MetricInfo from './MetricInfo'
import NeedCompanyNotice from './NeedCompanyNotice'
import YearToolbar from './YearToolbar'

function statusTone(kind, value) {
  if (value == null || Number.isNaN(value)) return 'neutral'
  switch (kind) {
    case 'current':
      if (value >= 1.5) return 'good'
      if (value >= 1) return 'ok'
      return 'bad'
    case 'quick':
      if (value >= 1) return 'good'
      if (value >= 0.7) return 'ok'
      return 'bad'
    case 'cash':
      if (value >= 0.2) return 'good'
      if (value >= 0.1) return 'ok'
      return 'bad'
    case 'debt':
      if (value <= 0.5) return 'good'
      if (value <= 0.7) return 'ok'
      return 'bad'
    case 'gearing':
      if (value <= 1) return 'good'
      if (value <= 2) return 'ok'
      return 'bad'
    case 'autonomy':
      if (value >= 0.4) return 'good'
      if (value >= 0.25) return 'ok'
      return 'bad'
    case 'coverage':
      if (value >= 1) return 'good'
      if (value >= 0.85) return 'ok'
      return 'bad'
    case 'margin':
      if (value >= 8) return 'good'
      if (value >= 2) return 'ok'
      return 'bad'
    case 'roe':
      if (value >= 12) return 'good'
      if (value >= 5) return 'ok'
      return 'bad'
    case 'roa':
      if (value >= 6) return 'good'
      if (value >= 2) return 'ok'
      return 'bad'
    case 'turnover':
      if (value >= 1) return 'good'
      if (value >= 0.5) return 'ok'
      return 'bad'
    case 'dso':
      if (value <= 45) return 'good'
      if (value <= 75) return 'ok'
      return 'bad'
    case 'signed':
      return value >= 0 ? 'good' : 'bad'
    case 'conan': {
      const band = interpretConan(value)
      if (band === 'safe') return 'good'
      if (band === 'watch') return 'ok'
      if (band === 'risk') return 'bad'
      return 'neutral'
    }
    default:
      return 'neutral'
  }
}

function toneLabel(tone, m) {
  if (tone === 'good') return m.toneGood || '●'
  if (tone === 'ok') return m.toneOk || '●'
  if (tone === 'bad') return m.toneBad || '●'
  return '—'
}

function RatioTile({ label, formula, value, tone, hint, percent, money, lang, m, metricId, digits }) {
  const display =
    value == null || Number.isNaN(value)
      ? '—'
      : money
        ? formatMoney(value, lang)
        : formatRatio(value, { percent, lang, digits: digits || 2 })
  const info = metricId
    ? buildMarketMetricInfo(metricId, value, { lang, percent, money, digits: digits || 2 })
    : null
  const closeLabel = m?.infoClose || (lang === 'ar' ? 'حسناً' : 'OK')
  return (
    <article className={`ratio-tile tone-${tone}`}>
      <div className="ratio-tile__top">
        <h3 className="analysis-heading-with-info">
          {label}
          {info && (
            <MetricInfo
              title={label}
              explanation={info.explanation}
              cases={info.cases}
              verdict={info.verdict}
              sectionLabels={info.sections}
              closeLabel={closeLabel}
            />
          )}
        </h3>
        <span className={`ratio-pill tone-${tone}`}>{toneLabel(tone, m || {})}</span>
      </div>
      <p className="ratio-tile__value">{display}</p>
      <p className="ratio-tile__formula">{formula}</p>
      {hint ? <p className="ratio-tile__hint">{hint}</p> : null}
    </article>
  )
}

function EmptyBlock({ a, d }) {
  return (
    <div className="dash-empty-state">
      <p>{a.empty}</p>
      <div className="analysis-empty-actions">
        <Link to="/dashboard/bilan" className="btn btn-primary">
          {d.bilan}
        </Link>
        <Link to="/dashboard/tcr" className="btn btn-ghost">
          {d.tcr}
        </Link>
      </div>
    </div>
  )
}

function ModuleHead({ title, lead, userId, year, onYearChange, t, moduleId }) {
  const a = t.analysis
  const deepHref = `/dashboard/analyse-lecture-approfondie?scope=${encodeURIComponent(moduleId || 'structure')}`
  return (
    <header className="analysis-page__head">
      <div className="analysis-page__top">
        <div className="analysis-page__intro">
          <p className="fin-kicker">{a.kicker}</p>
          <h1 className="analysis-page__title">{title}</h1>
          {lead ? <p className="analysis-page__lead">{lead}</p> : null}
        </div>
        {moduleId && moduleId !== 'cockpit' && moduleId !== 'stats' ? (
          <Link to={deepHref} className="deep-reading-cta">
            {a.deepReadingCta}
          </Link>
        ) : null}
      </div>
      <div className="analysis-page__tools">
        <YearToolbar userId={userId} activeYear={year} onYearChange={onYearChange} t={t} />
      </div>
    </header>
  )
}

function LiquidityBoard({ f, m, lang }) {
  const L = f.liquidity
  return (
    <div className="ratio-grid">
      <RatioTile metricId="currentRatio" label={m.currentRatio} formula={m.currentFormula} value={L.currentRatio} tone={statusTone('current', L.currentRatio)} hint={m.currentHint} lang={lang} m={m} />
      <RatioTile metricId="quickRatio" label={m.quickRatio} formula={m.quickFormula} value={L.quickRatio} tone={statusTone('quick', L.quickRatio)} hint={m.quickHint} lang={lang} m={m} />
      <RatioTile metricId="cashRatio" label={m.cashRatio} formula={m.cashFormula} value={L.cashRatio} tone={statusTone('cash', L.cashRatio)} hint={m.cashHint} lang={lang} m={m} />
    </div>
  )
}

function SolvencyBoard({ f, m, lang }) {
  const S = f.solvency
  return (
    <div className="ratio-grid">
      <RatioTile metricId="debtRatio" label={m.debtRatio} formula={m.debtFormula} value={S.debtRatio} tone={statusTone('debt', S.debtRatio)} hint={m.debtHint} lang={lang} m={m} />
      <RatioTile metricId="equityRatio" label={m.equityRatio} formula={m.equityFormula} value={S.equityRatio} tone={statusTone('autonomy', S.equityRatio)} hint={m.equityHint} lang={lang} m={m} />
      <RatioTile metricId="gearing" label={m.gearing} formula={m.gearingFormula} value={S.gearing} tone={statusTone('gearing', S.gearing)} hint={m.gearingHint} lang={lang} m={m} />
      <RatioTile metricId="autonomy" label={m.autonomy} formula={m.autonomyFormula} value={S.financialAutonomy} tone={statusTone('autonomy', S.financialAutonomy)} hint={m.autonomyHint} lang={lang} m={m} />
      <RatioTile metricId="coverage" label={m.coverage} formula={m.coverageFormula} value={S.longTermCoverage} tone={statusTone('coverage', S.longTermCoverage)} hint={m.coverageHint} lang={lang} m={m} />
      <RatioTile metricId="frng" label={m.frng} formula={m.frngFormula} value={S.frng} tone={statusTone('signed', S.frng)} hint={m.frngHint} lang={lang} m={m} money />
      <RatioTile metricId="bfr" label={m.bfr} formula={m.bfrFormula} value={S.bfr} tone={statusTone('signed', -S.bfr)} hint={m.bfrHint} lang={lang} m={m} money />
      <RatioTile metricId="treasuryNet" label={m.treasuryNet} formula={m.tnFormula} value={S.tresorerieNette} tone={statusTone('signed', S.tresorerieNette)} hint={m.tnHint} lang={lang} m={m} money />
    </div>
  )
}

function ProfitabilityBoard({ f, m, lang }) {
  const P = f.profitability
  return (
    <div className="ratio-grid">
      <RatioTile metricId="netMargin" label={m.netMargin} formula={m.netMarginFormula} value={P.netMargin} tone={statusTone('margin', P.netMargin)} hint={m.netMarginHint} percent lang={lang} m={m} />
      <RatioTile metricId="opMargin" label={m.opMargin} formula={m.opMarginFormula} value={P.operatingMargin} tone={statusTone('margin', P.operatingMargin)} hint={m.opMarginHint} percent lang={lang} m={m} />
      <RatioTile metricId="ebeMargin" label={m.ebeMargin} formula={m.ebeMarginFormula} value={P.ebeMargin} tone={statusTone('margin', P.ebeMargin)} hint={m.ebeMarginHint} percent lang={lang} m={m} />
      <RatioTile metricId="roa" label={m.roa} formula={m.roaFormula} value={P.roa} tone={statusTone('roa', P.roa)} hint={m.roaHint} percent lang={lang} m={m} />
      <RatioTile metricId="roe" label={m.roe} formula={m.roeFormula} value={P.roe} tone={statusTone('roe', P.roe)} hint={m.roeHint} percent lang={lang} m={m} />
    </div>
  )
}

function ActivityBoard({ f, m, lang }) {
  const A = f.activity
  return (
    <div className="ratio-grid">
      <RatioTile metricId="assetTurn" label={m.assetTurn} formula={m.assetTurnFormula} value={A.assetTurnover} tone={statusTone('turnover', A.assetTurnover)} hint={m.assetTurnHint} lang={lang} m={m} />
      <RatioTile metricId="invTurn" label={m.invTurn} formula={m.invTurnFormula} value={A.inventoryTurnover} tone={statusTone('turnover', A.inventoryTurnover)} hint={m.invTurnHint} lang={lang} m={m} />
      <RatioTile metricId="recTurn" label={m.recTurn} formula={m.recTurnFormula} value={A.receivablesTurnover} tone={statusTone('turnover', A.receivablesTurnover)} hint={m.recTurnHint} lang={lang} m={m} />
      <RatioTile metricId="dso" label={m.dso} formula={m.dsoFormula} value={A.dso} tone={statusTone('dso', A.dso)} hint={m.dsoHint} lang={lang} m={m} />
      <RatioTile metricId="dio" label={m.dio} formula={m.dioFormula} value={A.dio} tone={statusTone('dso', A.dio)} hint={m.dioHint} lang={lang} m={m} />
    </div>
  )
}

function DupontBoard({ f, m, lang }) {
  const D = f.dupont
  const closeLabel = m?.infoClose || (lang === 'ar' ? 'حسناً' : 'OK')
  const steps = [
    { label: m.dupontMargin, value: D.netMargin == null ? null : D.netMargin * 100, percent: true, metricId: 'dupontMargin', raw: D.netMargin },
    { label: m.dupontTurn, value: D.assetTurnover, metricId: 'dupontTurn', raw: D.assetTurnover },
    { label: m.dupontLev, value: D.equityMultiplier, metricId: 'dupontLev', raw: D.equityMultiplier },
  ]
  const roeInfo = buildMarketMetricInfo('dupontRoe', D.roe, { lang, percent: true })
  return (
    <div className="dupont-stage">
      <div className="dupont-chain">
        {steps.map((step, i) => {
          const info = buildMarketMetricInfo(step.metricId, step.raw, { lang, percent: !!step.percent })
          return (
            <div key={step.label} className="dupont-node">
              <span className="dupont-node__label analysis-heading-with-info">
                {step.label}
                <MetricInfo
                  title={step.label}
                  explanation={info.explanation}
                  cases={info.cases}
                  verdict={info.verdict}
                  sectionLabels={info.sections}
                  closeLabel={closeLabel}
                />
              </span>
              <strong>{formatRatio(step.value, { percent: !!step.percent, lang, digits: 3 })}</strong>
              {i < steps.length - 1 ? <span className="dupont-mul" aria-hidden="true">×</span> : null}
            </div>
          )
        })}
        <div className="dupont-eq" aria-hidden="true">
          =
        </div>
        <div className="dupont-node dupont-node--result">
          <span className="dupont-node__label analysis-heading-with-info">
            {m.dupontRoe}
            <MetricInfo
              title={m.dupontRoe}
              explanation={roeInfo.explanation}
              cases={roeInfo.cases}
              verdict={roeInfo.verdict}
              sectionLabels={roeInfo.sections}
              closeLabel={closeLabel}
            />
          </span>
          <strong>{formatRatio(D.roe != null ? D.roe * 100 : null, { percent: true, lang })}</strong>
        </div>
      </div>
      <p className="dupont-note">{m.dupontNote}</p>
      <div className="ratio-grid ratio-grid--tight">
        <RatioTile metricId="roe" label={m.roe} formula={m.roeFormula} value={f.profitability.roe} tone={statusTone('roe', f.profitability.roe)} percent lang={lang} m={m} />
        <RatioTile metricId="roa" label={m.roa} formula={m.roaFormula} value={f.profitability.roa} tone={statusTone('roa', f.profitability.roa)} percent lang={lang} m={m} />
      </div>
    </div>
  )
}

function ScoreBoard({ f, m, lang }) {
  const score = f.score.conanScore
  const band = interpretConan(score)
  const label =
    band === 'safe' ? m.scoreSafe : band === 'watch' ? m.scoreWatch : band === 'risk' ? m.scoreRisk : m.scoreUnknown
  const pct = score == null ? 0 : Math.max(0, Math.min(100, ((score + 0.2) / 0.5) * 100))
  const closeLabel = m?.infoClose || (lang === 'ar' ? 'حسناً' : 'OK')
  const conanInfo = buildMarketMetricInfo('conan', score, { lang, digits: 3 })

  return (
    <div className="score-stage">
      <div className={`score-gauge tone-${statusTone('conan', score)}`}>
        <div className="score-gauge__ring" style={{ '--score': `${pct}%` }}>
          <div className="score-gauge__core">
            <span className="analysis-heading-with-info">
              {m.conanTitle}
              <MetricInfo
                title={m.conanTitle}
                explanation={conanInfo.explanation}
                cases={conanInfo.cases}
                verdict={conanInfo.verdict}
                sectionLabels={conanInfo.sections}
                closeLabel={closeLabel}
              />
            </span>
            <strong>{formatRatio(score, { lang, digits: 3 })}</strong>
            <em>{label}</em>
          </div>
        </div>
        <p className="score-gauge__lead">{m.conanLead}</p>
      </div>
      <div className="ratio-grid">
        <RatioTile metricId="conanX1" label={m.x1} formula={m.x1Formula} value={f.score.x1} tone="neutral" lang={lang} m={m} />
        <RatioTile metricId="conanX2" label={m.x2} formula={m.x2Formula} value={f.score.x2} tone="neutral" lang={lang} m={m} />
        <RatioTile metricId="conanX3" label={m.x3} formula={m.x3Formula} value={f.score.x3} tone="neutral" lang={lang} m={m} />
        <RatioTile metricId="conanX4" label={m.x4} formula={m.x4Formula} value={f.score.x4} tone="neutral" lang={lang} m={m} />
        <RatioTile metricId="conanX5" label={m.x5} formula={m.x5Formula} value={f.score.x5} tone="neutral" lang={lang} m={m} />
      </div>
      <p className="score-disclaimer">{m.scoreDisclaimer}</p>
    </div>
  )
}

function TrendsBoard({ series, m, lang }) {
  if (!series.length) {
    return <p className="analysis-structure__note">{m.trendsEmpty}</p>
  }

  const keys = [
    { id: 'roe', metricId: 'roe', label: m.roe, get: (s) => s.f.profitability.roe, percent: true },
    { id: 'roa', metricId: 'roa', label: m.roa, get: (s) => s.f.profitability.roa, percent: true },
    { id: 'current', metricId: 'currentRatio', label: m.currentRatio, get: (s) => s.f.liquidity.currentRatio },
    { id: 'debt', metricId: 'debtRatio', label: m.debtRatio, get: (s) => s.f.solvency.debtRatio },
    { id: 'net', metricId: null, label: m.trendNet, get: (s) => s.f.tcr.net, money: true },
    { id: 'sales', metricId: null, label: m.trendSales, get: (s) => s.f.tcr.production, money: true },
  ]
  const closeLabel = m?.infoClose || (lang === 'ar' ? 'حسناً' : 'OK')

  return (
    <div className="trends-stage">
      <p className="analysis-structure__note">{m.trendsLead}</p>
      <div className="trends-table-wrap">
        <table className="trends-table">
          <thead>
            <tr>
              <th>{m.indicator}</th>
              {series.map((s) => (
                <th key={s.year}>{s.year}</th>
              ))}
              <th>{m.delta}</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((row) => {
              const vals = series.map((s) => row.get(s))
              const first = vals[0]
              const last = vals[vals.length - 1]
              let delta = null
              if (first != null && last != null && first !== 0) {
                delta = ((last - first) / Math.abs(first)) * 100
              } else if (first != null && last != null) {
                delta = last - first
              }
              const liveVal = last
              const info = row.metricId
                ? buildMarketMetricInfo(row.metricId, liveVal, { lang, percent: !!row.percent, money: !!row.money })
                : null
              return (
                <tr key={row.id}>
                  <td>
                    <span className="analysis-heading-with-info">
                      {row.label}
                      {info && (
                        <MetricInfo
                          title={row.label}
                          explanation={info.explanation}
                          cases={info.cases}
                          verdict={info.verdict}
                          sectionLabels={info.sections}
                          closeLabel={closeLabel}
                        />
                      )}
                    </span>
                  </td>
                  {vals.map((v, i) => (
                    <td key={`${row.id}-${series[i].year}`}>
                      {row.money
                        ? formatMoney(v ?? 0, lang)
                        : formatRatio(v, { percent: !!row.percent, lang })}
                    </td>
                  ))}
                  <td className={delta != null && delta >= 0 ? 'is-pos' : 'is-neg'}>
                    {delta == null ? '—' : `${delta >= 0 ? '+' : ''}${formatRatio(delta, { digits: 1, lang })} %`}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="trends-bars">
        {series.map((s) => {
          const roe = s.f.profitability.roe ?? 0
          const h = Math.max(8, Math.min(100, Math.abs(roe) * 4))
          return (
            <div key={s.year} className="trends-bar">
              <div
                className={`trends-bar__fill ${roe >= 0 ? 'is-pos' : 'is-neg'}`}
                style={{ height: `${h}%` }}
                title={`ROE ${formatRatio(roe, { percent: true, lang })}`}
              />
              <span>{s.year}</span>
            </div>
          )
        })}
      </div>
      <p className="ratio-tile__hint">{m.trendsRoeCaption}</p>
    </div>
  )
}

function CockpitBoard({ f, m, lang, series }) {
  const closeLabel = m?.infoClose || (lang === 'ar' ? 'حسناً' : 'OK')
  const tiles = [
    { metricId: 'currentRatio', label: m.currentRatio, value: f.liquidity.currentRatio, tone: statusTone('current', f.liquidity.currentRatio) },
    { metricId: 'quickRatio', label: m.quickRatio, value: f.liquidity.quickRatio, tone: statusTone('quick', f.liquidity.quickRatio) },
    { metricId: 'roe', label: m.roe, value: f.profitability.roe, tone: statusTone('roe', f.profitability.roe), percent: true },
    { metricId: 'roa', label: m.roa, value: f.profitability.roa, tone: statusTone('roa', f.profitability.roa), percent: true },
    { metricId: 'debtRatio', label: m.debtRatio, value: f.solvency.debtRatio, tone: statusTone('debt', f.solvency.debtRatio) },
    { metricId: 'netMargin', label: m.netMargin, value: f.profitability.netMargin, tone: statusTone('margin', f.profitability.netMargin), percent: true },
    {
      metricId: 'conan',
      label: m.conanShort,
      value: f.score.conanScore,
      tone: statusTone('conan', f.score.conanScore),
      digits: 3,
    },
    {
      metricId: 'treasuryNet',
      label: m.treasuryNet,
      value: f.solvency.tresorerieNette,
      tone: statusTone('signed', f.solvency.tresorerieNette),
      money: true,
    },
  ]

  const band = interpretConan(f.score.conanScore)
  const verdict =
    band === 'safe' ? m.verdictSafe : band === 'watch' ? m.verdictWatch : band === 'risk' ? m.verdictRisk : m.verdictUnknown

  return (
    <div className="cockpit">
      <div className="cockpit-ticker" aria-hidden="true">
        <div className="cockpit-ticker__track">
          {[...tiles, ...tiles].map((tile, i) => (
            <span key={`${tile.label}-${i}`} className={`cockpit-chip tone-${tile.tone}`}>
              {tile.label}{' '}
              <strong>
                {tile.money
                  ? formatMoney(tile.value ?? 0, lang)
                  : formatRatio(tile.value, { percent: !!tile.percent, digits: tile.digits || 2, lang })}
              </strong>
            </span>
          ))}
        </div>
      </div>

      <div className="cockpit-hero">
        <article className="cockpit-verdict">
          <p className="fin-kicker">{m.deskBadge}</p>
          <h2 className="analysis-heading-with-info">
            {m.deskTitle}
            {(() => {
              const info = buildMarketMetricInfo('conan', f.score.conanScore, { lang, digits: 3 })
              return (
                <MetricInfo
                  title={m.deskTitle}
                  explanation={info.explanation}
                  cases={info.cases}
                  verdict={verdict}
                  sectionLabels={info.sections}
                  closeLabel={closeLabel}
                />
              )
            })()}
          </h2>
          <p className={`cockpit-verdict__line tone-${statusTone('conan', f.score.conanScore)}`}>{verdict}</p>
          <p className="cockpit-verdict__note">{m.deskNote}</p>
        </article>
        <article className="cockpit-pulse">
          <div className="cockpit-pulse__row">
            <span>{m.trendSales}</span>
            <strong>{formatMoney(f.tcr.production, lang)}</strong>
          </div>
          <div className="cockpit-pulse__row">
            <span>{m.trendNet}</span>
            <strong className={f.tcr.net >= 0 ? 'is-pos' : 'is-neg'}>{formatMoney(f.tcr.net, lang)}</strong>
          </div>
          <div className="cockpit-pulse__row">
            <span>{m.ebeShort}</span>
            <strong>{formatMoney(f.tcr.ebe, lang)}</strong>
          </div>
          <div className="cockpit-pulse__row">
            <span>{m.totalActif}</span>
            <strong>{formatMoney(f.bilan.totalActif, lang)}</strong>
          </div>
        </article>
      </div>

      <div className="cockpit-heat">
        {tiles.map((tile) => {
          const info = buildMarketMetricInfo(tile.metricId, tile.value, {
            lang,
            percent: !!tile.percent,
            money: !!tile.money,
            digits: tile.digits || 2,
          })
          return (
            <div key={tile.label} className={`cockpit-heat__cell tone-${tile.tone}`}>
              <span className="analysis-heading-with-info">
                {tile.label}
                <MetricInfo
                  title={tile.label}
                  explanation={info.explanation}
                  cases={info.cases}
                  verdict={info.verdict}
                  sectionLabels={info.sections}
                  closeLabel={closeLabel}
                />
              </span>
              <strong>
                {tile.money
                  ? formatMoney(tile.value ?? 0, lang)
                  : formatRatio(tile.value, { percent: !!tile.percent, digits: tile.digits || 2, lang })}
              </strong>
            </div>
          )
        })}
      </div>

      {series.length > 1 ? (
        <div className="cockpit-sparks">
          <h3>{m.multiYearPulse}</h3>
          <div className="trends-bars trends-bars--compact">
            {series.map((s) => {
              const roe = s.f.profitability.roe ?? 0
              const h = Math.max(10, Math.min(100, Math.abs(roe) * 4))
              return (
                <div key={s.year} className="trends-bar">
                  <div className={`trends-bar__fill ${roe >= 0 ? 'is-pos' : 'is-neg'}`} style={{ height: `${h}%` }} />
                  <span>{s.year}</span>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}

      <div className="cockpit-links">
        {ANALYSIS_MODULES.filter((mod) => mod.id !== 'cockpit' && mod.id !== 'structure').map((mod) => (
          <Link key={mod.id} to={mod.path} className="cockpit-link">
            {m.nav?.[mod.id] || mod.id}
          </Link>
        ))}
      </div>
    </div>
  )
}

export default function AnalysisModule({ user, moduleId }) {
  const { t, lang } = useLandingLang()
  const d = t.dashboard
  const a = t.analysis
  const m = t.modules || {}
  const meta = m[moduleId] || {}
  const [state, setState] = useState(() => loadFinancial(user.id))
  const year = state.activeYear || state.exerciseLabel

  const fundamentals = useMemo(
    () => computeFundamentals({ bilanRows: state.bilanRows, tcrAmounts: state.tcrAmounts }),
    [state],
  )

  const series = useMemo(() => {
    const years = listYears(user.id)
    return years
      .map((y) => {
        const data = loadFinancial(user.id, y)
        const f = computeFundamentals({ bilanRows: data.bilanRows, tcrAmounts: data.tcrAmounts })
        return { year: y, f }
      })
      .filter((s) => !s.f.empty)
  }, [user.id, state])

  const onYearChange = (nextYear) => setState(loadFinancial(user.id, nextYear))

  const title = meta.title || a.title
  const lead = meta.lead || a.lead

  if (state.noCompany) {
    return <NeedCompanyNotice t={t} />
  }

  return (
    <section className="analysis-page">
      <ModuleHead
        title={title}
        lead={lead}
        userId={user.id}
        year={year}
        onYearChange={onYearChange}
        t={t}
        moduleId={moduleId}
      />

      {fundamentals.empty && moduleId !== 'trends' ? (
        <EmptyBlock a={a} d={d} />
      ) : moduleId === 'trends' && !series.length ? (
        <EmptyBlock a={a} d={d} />
      ) : (
        <div className="analysis-stage">
          {moduleId === 'cockpit' && <CockpitBoard f={fundamentals} m={m} lang={lang} series={series} />}
          {moduleId === 'liquidity' && <LiquidityBoard f={fundamentals} m={m} lang={lang} />}
          {moduleId === 'solvency' && <SolvencyBoard f={fundamentals} m={m} lang={lang} />}
          {moduleId === 'profitability' && <ProfitabilityBoard f={fundamentals} m={m} lang={lang} />}
          {moduleId === 'activity' && <ActivityBoard f={fundamentals} m={m} lang={lang} />}
          {moduleId === 'dupont' && <DupontBoard f={fundamentals} m={m} lang={lang} />}
          {moduleId === 'score' && <ScoreBoard f={fundamentals} m={m} lang={lang} />}
          {moduleId === 'trends' && <TrendsBoard series={series} m={m} lang={lang} />}
        </div>
      )}
    </section>
  )
}
