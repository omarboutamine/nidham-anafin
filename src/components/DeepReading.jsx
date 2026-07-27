import { startTransition, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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
import { buildStructureMetricInfo } from '../config/structureMetricReadings'
import { useLandingLang } from '../hooks/useLandingLang'
import { formatRatio } from '../services/analysisEngine'
import { listYears, loadFinancial } from '../services/financialStore'
import {
  DEEP_READING_PRESETS,
  DEEP_READING_VARS,
  computeStructureMetrics,
} from '../services/structureMetrics'
import NeedCompanyNotice from './NeedCompanyNotice'

const VAR_LABEL_KEYS = {
  frng: 'frng',
  bfr: 'bfr',
  tresorerie: 'treasuryNet',
  totalActif: 'totalActif',
  totalPassif: 'totalPassif',
  liquidity: 'liquidity',
  shareCourant: 'actifCourantShare',
  shareNonCourant: 'actifNonCourantShare',
  shareEquity: 'equityShare',
  shareDebt: 'debtShare',
}

function varMeta(id) {
  return DEEP_READING_VARS.find((v) => v.id === id)
}

function formatSeriesValue(id, value, lang) {
  if (value == null || Number.isNaN(value)) return '—'
  const meta = varMeta(id)
  if (!meta) return String(value)
  if (meta.scale === 'money') return formatMoney(value, lang)
  if (meta.scale === 'pct') return `${formatRatio(value, { digits: 1, lang })} %`
  return formatRatio(value, { digits: 2, lang })
}

function ChartTooltip({ active, payload, label, lang, labels }) {
  if (!active || !payload?.length) return null
  return (
    <div className="deep-chart-tooltip">
      <strong>{label}</strong>
      <ul>
        {payload.map((p) => (
          <li key={p.dataKey} style={{ color: p.color }}>
            <span>{labels[p.dataKey] || p.dataKey}</span>
            <em>{formatSeriesValue(p.dataKey, p.value, lang)}</em>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function DeepReading({ user }) {
  const { t, lang, dir } = useLandingLang()
  const a = t.analysis
  const d = t.dashboard
  const [probe] = useState(() => loadFinancial(user.id))
  const [selected, setSelected] = useState(() => [...DEEP_READING_PRESETS.balance])
  const [activePreset, setActivePreset] = useState('balance')

  const series = useMemo(() => {
    if (probe.noCompany) return []
    const years = listYears(user.id)
    return years
      .map((year) => {
        const data = loadFinancial(user.id, year)
        const metrics = computeStructureMetrics(data.bilanRows)
        return { year, metrics }
      })
      .filter((row) => !row.metrics.empty)
  }, [user.id, probe.noCompany])

  const labels = useMemo(() => {
    const map = {}
    for (const v of DEEP_READING_VARS) {
      map[v.id] = a[VAR_LABEL_KEYS[v.id]] || v.id
    }
    return map
  }, [a])

  const chartData = useMemo(
    () =>
      series.map(({ year, metrics }) => {
        const row = { year }
        for (const v of DEEP_READING_VARS) {
          row[v.id] = metrics[v.id]
        }
        return row
      }),
    [series],
  )

  const selectedMeta = selected.map(varMeta).filter(Boolean)
  const hasMoney = selectedMeta.some((v) => v.scale === 'money')
  const hasSecondary = selectedMeta.some((v) => v.scale === 'ratio' || v.scale === 'pct')
  const dualAxis = hasMoney && hasSecondary

  const readings = useMemo(
    () =>
      series.map(({ year, metrics }) => ({
        year,
        overview: buildStructureMetricInfo('overview', metrics, lang).verdict,
        liquidity: buildStructureMetricInfo('liquidity', metrics, lang).verdict,
        frng: buildStructureMetricInfo('frng', metrics, lang).verdict,
        bfr: buildStructureMetricInfo('bfr', metrics, lang).verdict,
        treasury: buildStructureMetricInfo('treasuryNet', metrics, lang).verdict,
        metrics,
      })),
    [series, lang],
  )

  const delta = useMemo(() => {
    if (series.length < 2) return null
    const first = series[0]
    const last = series[series.length - 1]
    const keys = ['frng', 'bfr', 'tresorerie', 'liquidity', 'shareEquity']
    return keys.map((id) => {
      const a0 = first.metrics[id]
      const a1 = last.metrics[id]
      if (a0 == null || a1 == null) return { id, from: a0, to: a1, change: null }
      return { id, from: a0, to: a1, change: a1 - a0 }
    })
  }, [series])

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
      setSelected([...DEEP_READING_PRESETS[key]])
    })
  }

  if (probe.noCompany) {
    return <NeedCompanyNotice t={t} />
  }

  if (!series.length) {
    return (
      <section className="analysis-page deep-reading">
        <header className="analysis-page__head deep-reading__head">
          <div className="analysis-page__intro">
            <p className="fin-kicker">{a.deepReadingKicker}</p>
            <h1 className="analysis-page__title">{a.deepReadingTitle}</h1>
          </div>
          <Link to="/dashboard/analyse-structure" className="deep-reading-cta deep-reading__back">
            {a.deepReadingBack}
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
          <h1 className="analysis-page__title">{a.deepReadingTitle}</h1>
          <p className="analysis-page__lead">{a.deepReadingLead}</p>
          <p className="deep-reading__meta">
            {a.deepReadingYearsCount.replace('{n}', String(series.length))}
            {' · '}
            {series[0].year} → {series[series.length - 1].year}
          </p>
        </div>
        <Link to="/dashboard/analyse-structure" className="deep-reading-cta deep-reading__back">
          {a.deepReadingBack}
        </Link>
      </header>

      <div className="deep-reading__stage">
        <section className="deep-panel deep-panel--controls" aria-label={a.deepReadingVars}>
          <div className="deep-panel__head">
            <h2>{a.deepReadingPresets}</h2>
            <p>{a.deepReadingSelectHint}</p>
          </div>
          <div className="deep-presets" role="group">
            {[
              ['balance', a.deepReadingPresetBalance],
              ['liquidity', a.deepReadingPresetLiquidity],
              ['size', a.deepReadingPresetSize],
              ['composition', a.deepReadingPresetComposition],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`deep-preset ${activePreset === key ? 'is-active' : ''}`}
                onClick={() => applyPreset(key)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="deep-vars" role="group" aria-label={a.deepReadingVars}>
            {DEEP_READING_VARS.map((v) => {
              const on = selected.includes(v.id)
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
                  {labels[v.id]}
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
                <XAxis
                  dataKey="year"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.12)' }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={72}
                  tickFormatter={(v) =>
                    hasMoney ? formatMoney(v, lang).replace(/\s/g, '\u00a0') : formatRatio(v, { digits: 1, lang })
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
                    tickFormatter={(v) => formatRatio(v, { digits: 1, lang })}
                  />
                )}
                <Tooltip
                  content={<ChartTooltip lang={lang} labels={labels} />}
                  cursor={{ stroke: 'rgba(212,175,55,0.35)' }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: 8, color: '#cbd5e1', fontSize: 12 }}
                  formatter={(value) => labels[value] || value}
                />
                {selected.map((id) => {
                  const meta = varMeta(id)
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
                const tone =
                  row.change == null ? '' : row.change > 0 ? 'is-pos' : row.change < 0 ? 'is-neg' : ''
                return (
                  <article key={row.id} className="deep-delta-card">
                    <span>{labels[row.id]}</span>
                    <strong className={tone}>
                      {row.change == null
                        ? '—'
                        : `${row.change > 0 ? '+' : ''}${formatSeriesValue(row.id, row.change, lang)}`}
                    </strong>
                    <small>
                      {formatSeriesValue(row.id, row.from, lang)} → {formatSeriesValue(row.id, row.to, lang)}
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
                {[...series].reverse().map(({ year, metrics }) => (
                  <tr key={year}>
                    <td>{year}</td>
                    {selected.map((id) => (
                      <td key={id}>{formatSeriesValue(id, metrics[id], lang)}</td>
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
                  <p className="deep-timeline__overview">{row.overview}</p>
                  <ul className="deep-timeline__points">
                    <li>{row.liquidity}</li>
                    <li>{row.frng}</li>
                    <li>{row.bfr}</li>
                    <li>{row.treasury}</li>
                  </ul>
                  <div className="deep-timeline__kpis">
                    <span>
                      {a.liquidity}: <strong>{formatSeriesValue('liquidity', row.metrics.liquidity, lang)}</strong>
                    </span>
                    <span>
                      FRNG: <strong className={row.metrics.frng >= 0 ? 'is-pos' : 'is-neg'}>{formatSeriesValue('frng', row.metrics.frng, lang)}</strong>
                    </span>
                    <span>
                      BFR: <strong className={row.metrics.bfr >= 0 ? 'is-pos' : 'is-neg'}>{formatSeriesValue('bfr', row.metrics.bfr, lang)}</strong>
                    </span>
                    <span>
                      TN: <strong className={row.metrics.tresorerie >= 0 ? 'is-pos' : 'is-neg'}>{formatSeriesValue('tresorerie', row.metrics.tresorerie, lang)}</strong>
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </section>
  )
}
