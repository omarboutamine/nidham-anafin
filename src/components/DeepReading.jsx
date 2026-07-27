import { startTransition, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatMoney } from '../config/financialTemplates'
import {
  buildDeepYearSeries,
  buildYearReadings,
  resolveDeepScope,
  resolveVarLabel,
} from '../config/deepReadingScopes'
import { buildStructureMetricInfo } from '../config/structureMetricReadings'
import { buildMarketMetricInfo } from '../config/marketMetricReadings'
import { useLandingLang } from '../hooks/useLandingLang'
import { formatRatio } from '../services/analysisEngine'
import { loadFinancial } from '../services/financialStore'
import MetricInfo from './MetricInfo'
import NeedCompanyNotice from './NeedCompanyNotice'

function formatSeriesValue(varDef, value, lang) {
  if (value == null || Number.isNaN(value)) return '—'
  if (!varDef) return String(value)
  if (varDef.scale === 'money') return formatMoney(value, lang)
  if (varDef.scale === 'pct') return `${formatRatio(value, { digits: 1, lang })} %`
  return formatRatio(value, { digits: varDef.id === 'conanScore' ? 3 : 2, lang })
}

function ChartTooltip({ active, payload, label, lang, labelMap, varMap }) {
  if (!active || !payload?.length) return null
  return (
    <div className="deep-chart-tooltip">
      <strong>{label}</strong>
      <ul>
        {payload.map((p) => (
          <li key={p.dataKey} style={{ color: p.color }}>
            <span>{labelMap[p.dataKey] || p.dataKey}</span>
            <em>{formatSeriesValue(varMap[p.dataKey], p.value, lang)}</em>
          </li>
        ))}
      </ul>
    </div>
  )
}

function presetLabel(key, a, lang) {
  const map = {
    balance: a.deepReadingPresetBalance,
    liquidity: a.deepReadingPresetLiquidity,
    size: a.deepReadingPresetSize,
    composition: a.deepReadingPresetComposition,
    all: lang === 'fr' ? 'Tous' : 'الكل',
    core: lang === 'fr' ? 'Essentiel' : 'الأساسي',
    ratios: lang === 'fr' ? 'Ratios' : 'النسب',
    margins: lang === 'fr' ? 'Marges' : 'الهوامش',
    returns: lang === 'fr' ? 'Rendements' : 'المردودية',
    turns: lang === 'fr' ? 'Rotations' : 'الدوران',
    delays: lang === 'fr' ? 'Délais' : 'الآجال',
    chain: lang === 'fr' ? 'Chaîne DuPont' : 'سلسلة DuPont',
    compare: lang === 'fr' ? 'Comparaison' : 'مقارنة',
    score: lang === 'fr' ? 'Score' : 'الدرجة',
    factors: lang === 'fr' ? 'Facteurs' : 'العوامل',
    risk: lang === 'fr' ? 'Risque / liquidité' : 'مخاطر / سيولة',
  }
  return map[key] || key
}

export default function DeepReading({ user }) {
  const { t, lang, dir } = useLandingLang()
  const a = t.analysis
  const d = t.dashboard
  const m = t.modules || {}
  const [params] = useSearchParams()
  const scope = useMemo(() => resolveDeepScope(params.get('scope')), [params])
  const [probe] = useState(() => loadFinancial(user.id))
  const [selected, setSelected] = useState(() => [...(scope.presets[scope.defaultPreset] || scope.vars.map((v) => v.id))])
  const [activePreset, setActivePreset] = useState(scope.defaultPreset)

  useEffect(() => {
    const next = [...(scope.presets[scope.defaultPreset] || scope.vars.map((v) => v.id))]
    setSelected(next)
    setActivePreset(scope.defaultPreset)
  }, [scope.id, scope.defaultPreset, scope.presets, scope.vars])

  const series = useMemo(() => {
    if (probe.noCompany) return []
    return buildDeepYearSeries(user.id)
  }, [user.id, probe.noCompany])

  const varMap = useMemo(() => Object.fromEntries(scope.vars.map((v) => [v.id, v])), [scope.vars])

  const labels = useMemo(() => {
    const map = {}
    for (const v of scope.vars) map[v.id] = resolveVarLabel(v, t)
    return map
  }, [scope.vars, t])

  const chartData = useMemo(
    () =>
      series.map((row) => {
        const out = { year: row.year }
        for (const v of scope.vars) out[v.id] = row.values[v.id]
        return out
      }),
    [series, scope.vars],
  )

  const selectedMeta = selected.map((id) => varMap[id]).filter(Boolean)
  const hasMoney = selectedMeta.some((v) => v.scale === 'money')
  const hasSecondary = selectedMeta.some((v) => v.scale === 'ratio' || v.scale === 'pct')
  const dualAxis = hasMoney && hasSecondary

  const readings = useMemo(
    () => series.map((row) => buildYearReadings(row, scope, lang)),
    [series, scope, lang],
  )

  const delta = useMemo(() => {
    if (series.length < 2) return null
    const first = series[0]
    const last = series[series.length - 1]
    const keys = (scope.deltaKeys || selected).filter((id) => varMap[id])
    return keys.map((id) => {
      const a0 = first.values[id]
      const a1 = last.values[id]
      if (a0 == null || a1 == null) return { id, from: a0, to: a1, change: null }
      return { id, from: a0, to: a1, change: a1 - a0 }
    })
  }, [series, scope.deltaKeys, selected, varMap])

  const pageTitle =
    scope.kind === 'structure'
      ? a.deepReadingTitle
      : `${a.deepReadingCta} — ${m[scope.moduleId]?.title || scope.moduleId}`
  const pageLead =
    scope.kind === 'structure'
      ? a.deepReadingLead
      : lang === 'fr'
        ? 'Lecture horizontale multi-exercices des indicateurs de ce module : liaisons, tendances et verdicts dynamiques.'
        : 'قراءة أفقية عبر السنوات لمؤشرات هذه الصفحة: ربط بينها، اتجاهات، وقراءات ديناميكية.'

  const overviewInfo = useMemo(() => {
    if (!series.length) return null
    const last = series[series.length - 1]
    if (scope.kind === 'structure') return buildStructureMetricInfo('overview', last.structure, lang)
    const firstVar = scope.vars[0]
    if (!firstVar?.marketId) return null
    let value = last.values[firstVar.id]
    if (firstVar.id === 'dupontMargin' || firstVar.id === 'dupontRoe') value = value == null ? null : value / 100
    return buildMarketMetricInfo(firstVar.marketId, value, {
      lang,
      money: firstVar.scale === 'money',
      percent: firstVar.scale === 'pct' && !String(firstVar.id).startsWith('dupont'),
    })
  }, [series, scope, lang])

  const toggleVar = (id) => {
    startTransition(() => {
      setActivePreset('custom')
      setSelected((prev) => {
        if (prev.includes(id)) {
          if (prev.length === 1) return prev
          return prev.filter((x) => x !== id)
        }
        return [...prev, id]
      })
    })
  }

  const applyPreset = (key) => {
    startTransition(() => {
      setActivePreset(key)
      setSelected([...(scope.presets[key] || [])])
    })
  }

  if (probe.noCompany) return <NeedCompanyNotice t={t} />

  if (!series.length) {
    return (
      <section className="analysis-page deep-reading">
        <header className="analysis-page__head deep-reading__head">
          <div className="analysis-page__intro">
            <p className="fin-kicker">{a.deepReadingKicker}</p>
            <h1 className="analysis-page__title">{pageTitle}</h1>
          </div>
          <Link to={scope.backPath} className="deep-reading-cta deep-reading__back">
            {scope.kind === 'structure' ? a.deepReadingBack : lang === 'fr' ? 'Retour au module' : 'العودة إلى الوحدة'}
          </Link>
        </header>
        <div className="dash-empty-state">
          <p>{a.deepReadingEmpty}</p>
          <Link to="/dashboard/bilan" className="btn btn-primary">
            {d.bilan}
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="analysis-page deep-reading">
      <header className="analysis-page__head deep-reading__head">
        <div className="analysis-page__intro">
          <p className="fin-kicker">{a.deepReadingKicker}</p>
          <h1 className="analysis-page__title analysis-heading-with-info">
            {pageTitle}
            {overviewInfo && (
              <MetricInfo
                title={pageTitle}
                explanation={overviewInfo.explanation}
                cases={overviewInfo.cases}
                verdict={overviewInfo.verdict}
                sectionLabels={overviewInfo.sections}
                closeLabel={a.infoClose}
              />
            )}
          </h1>
          <p className="analysis-page__lead">{pageLead}</p>
          <p className="deep-reading__meta">
            {a.deepReadingYearsCount.replace('{n}', String(series.length))}
            {' · '}
            {series[0].year} → {series[series.length - 1].year}
          </p>
        </div>
        <Link to={scope.backPath} className="deep-reading-cta deep-reading__back">
          {scope.kind === 'structure' ? a.deepReadingBack : lang === 'fr' ? 'Retour au module' : 'العودة إلى الوحدة'}
        </Link>
      </header>

      <div className="deep-reading__stage">
        <section className="deep-panel deep-panel--controls" aria-label={a.deepReadingVars}>
          <div className="deep-panel__head">
            <h2>{a.deepReadingPresets}</h2>
            <p>{a.deepReadingSelectHint}</p>
          </div>
          <div className="deep-presets" role="group">
            {Object.keys(scope.presets).map((key) => (
              <button
                key={key}
                type="button"
                className={`deep-preset ${activePreset === key ? 'is-active' : ''}`}
                onClick={() => applyPreset(key)}
              >
                {presetLabel(key, a, lang)}
              </button>
            ))}
          </div>

          <div className="deep-vars" role="group" aria-label={a.deepReadingVars}>
            {scope.vars.map((v) => {
              const on = selected.includes(v.id)
              const last = series[series.length - 1]
              let info = null
              if (last && v.marketId) {
                let value = last.values[v.id]
                if (v.id === 'dupontMargin' || v.id === 'dupontRoe') value = value == null ? null : value / 100
                if (scope.kind === 'structure') {
                  info = buildStructureMetricInfo(
                    v.id === 'tresorerie' ? 'treasuryNet' : v.marketId,
                    last.structure,
                    lang,
                  )
                } else {
                  info = buildMarketMetricInfo(v.marketId, value, {
                    lang,
                    money: v.scale === 'money',
                    percent: v.scale === 'pct' && !String(v.id).startsWith('dupont'),
                    digits: v.id === 'conanScore' ? 3 : 2,
                  })
                }
              }
              return (
                <button
                  key={v.id}
                  type="button"
                  className={`deep-var ${on ? 'is-on' : ''}`}
                  style={{ '--deep-var-color': v.color }}
                  aria-pressed={on}
                  onClick={() => toggleVar(v.id)}
                >
                  <span className="deep-var__swatch" aria-hidden="true" />
                  <span className="analysis-heading-with-info">
                    {labels[v.id]}
                    {info && (
                      <MetricInfo
                        title={labels[v.id]}
                        explanation={info.explanation}
                        cases={info.cases}
                        verdict={info.verdict}
                        sectionLabels={info.sections}
                        closeLabel={a.infoClose}
                      />
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="deep-panel deep-panel--chart">
          <div className="deep-panel__head">
            <h2>{a.deepReadingChart}</h2>
          </div>
          <div className="deep-chart" dir="ltr">
            <ResponsiveContainer width="100%" height={360}>
              <LineChart data={chartData} margin={{ top: 12, right: 18, left: 8, bottom: 8 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 6" />
                <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.12)' }} tickLine={false} />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={72}
                  tickFormatter={(val) =>
                    hasMoney ? formatMoney(val, lang).replace(/\s/g, '\u00a0') : formatRatio(val, { digits: 1, lang })
                  }
                />
                {dualAxis && (
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                    tickFormatter={(val) => formatRatio(val, { digits: 1, lang })}
                  />
                )}
                <Tooltip content={<ChartTooltip lang={lang} labelMap={labels} varMap={varMap} />} cursor={{ stroke: 'rgba(212,175,55,0.35)' }} />
                <Legend wrapperStyle={{ paddingTop: 8, color: '#cbd5e1', fontSize: 12 }} formatter={(value) => labels[value] || value} />
                {selected.map((id) => {
                  const meta = varMap[id]
                  if (!meta) return null
                  const yAxisId = dualAxis && meta.scale !== 'money' ? 'right' : 'left'
                  return (
                    <Line
                      key={id}
                      type="monotone"
                      dataKey={id}
                      name={id}
                      yAxisId={yAxisId}
                      stroke={meta.color}
                      strokeWidth={2.4}
                      dot={{ r: 3.5, strokeWidth: 0, fill: meta.color }}
                      activeDot={{ r: 5.5 }}
                      connectNulls
                      animationDuration={550}
                    />
                  )
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {delta && (
          <section className="deep-panel deep-panel--delta">
            <div className="deep-panel__head">
              <h2>{a.deepReadingDelta}</h2>
              <p>
                {series[0].year} → {series[series.length - 1].year}
              </p>
            </div>
            <div className="deep-delta-grid">
              {delta.map((row) => {
                const tone = row.change == null ? '' : row.change > 0 ? 'is-pos' : row.change < 0 ? 'is-neg' : ''
                const def = varMap[row.id]
                return (
                  <article key={row.id} className="deep-delta-card">
                    <span>{labels[row.id]}</span>
                    <strong className={tone}>
                      {row.change == null
                        ? '—'
                        : `${row.change > 0 ? '+' : ''}${formatSeriesValue(def, row.change, lang)}`}
                    </strong>
                    <small>
                      {formatSeriesValue(def, row.from, lang)} → {formatSeriesValue(def, row.to, lang)}
                    </small>
                  </article>
                )
              })}
            </div>
          </section>
        )}

        <section className="deep-panel deep-panel--table">
          <div className="deep-panel__head">
            <h2>{a.deepReadingTable}</h2>
          </div>
          <div className="deep-table-wrap" dir={dir}>
            <table className="deep-table">
              <thead>
                <tr>
                  <th>{a.yearFor}</th>
                  {selected.map((id) => (
                    <th key={id}>{labels[id]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...series].reverse().map((row) => (
                  <tr key={row.year}>
                    <td>{row.year}</td>
                    {selected.map((id) => (
                      <td key={id}>{formatSeriesValue(varMap[id], row.values[id], lang)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="deep-panel deep-panel--timeline">
          <div className="deep-panel__head">
            <h2>{a.deepReadingTimeline}</h2>
            <p>{a.deepReadingTimelineLead}</p>
          </div>
          <ol className="deep-timeline">
            {[...readings].reverse().map((row) => (
              <li key={row.year} className="deep-timeline__item">
                <div className="deep-timeline__year">{row.year}</div>
                <div className="deep-timeline__body">
                  {row.overview && <p className="deep-timeline__overview">{row.overview}</p>}
                  <ul className="deep-timeline__points">
                    {row.points.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </section>
  )
}
