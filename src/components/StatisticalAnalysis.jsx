import { useMemo, useRef, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import { statsCopy } from '../config/statsI18n'
import { buildStatsSectionInfo } from '../config/statsSectionReadings'
import { useLandingLang } from '../hooks/useLandingLang'
import { formatRatio } from '../services/analysisEngine'
import { getActiveCompany } from '../services/companyStore'
import {
  STAT_TEMPLATES,
  STAT_VAR_DEFS,
  buildCompanyYearSeries,
  buildMultiCompanySeries,
  loadTabularUpload,
  seriesMapFromRows,
} from '../services/statsData'
import {
  correlationMatrix,
  describeSeries,
  mannWhitneyU,
  multipleRegression,
  oneWayAnova,
  sampleSizeWarning,
  simpleRegression,
  timeTrend,
} from '../services/statsEngine'
import { listStatsSessions, removeStatsSession, saveStatsSession } from '../services/statsSessions'
import MetricInfo from './MetricInfo'
import DarkSelect from './DarkSelect'
import NeedCompanyNotice from './NeedCompanyNotice'

function SectionTitle({ title, sectionId, lang, closeLabel }) {
  const info = buildStatsSectionInfo(sectionId, lang)
  return (
    <h2 className="analysis-heading-with-info">
      {title}
      <MetricInfo
        title={title}
        explanation={info.explanation}
        cases={info.cases}
        verdict={info.verdict}
        sectionLabels={info.sections}
        closeLabel={closeLabel}
      />
    </h2>
  )
}

function fmt(v, lang, digits = 4) {
  if (v == null || Number.isNaN(v)) return '—'
  return formatRatio(v, { digits, lang })
}

function guessYearKey(headers) {
  const hit = (headers || []).find((h) => /^(year|année|annee|exercice|سنة)$/i.test(String(h).trim()))
  return hit || headers?.[0] || 'year'
}

const COMPARE_COLORS = ['#d4af37', '#38bdf8', '#34d399', '#f472b6', '#a78bfa', '#fb923c']

export default function StatisticalAnalysis({ user }) {
  const { t, lang } = useLandingLang()
  const s = statsCopy[lang === 'fr' ? 'fr' : 'ar']
  const company = getActiveCompany(user.id)
  const fileRef = useRef(null)
  const closeLabel = lang === 'ar' ? 'حسناً' : 'OK'

  const [tab, setTab] = useState('company')
  const [selectedVars, setSelectedVars] = useState(['liquidity', 'frng', 'bfr', 'tresorerie', 'shareEquity'])
  const [yVar, setYVar] = useState('tresorerie')
  const [xVar, setXVar] = useState('frng')
  const [xVars, setXVars] = useState(['frng', 'bfr'])
  const [upload, setUpload] = useState(null)
  const [compareVar, setCompareVar] = useState('liquidity')
  const [flash, setFlash] = useState('')
  const [sessionsTick, setSessionsTick] = useState(0)

  const companyRows = useMemo(() => {
    if (!company) return []
    return buildCompanyYearSeries(user.id, company.id)
  }, [user.id, company])

  const activeRows = tab === 'upload' && upload?.rows?.length ? upload.rows : companyRows
  const yearKey = tab === 'upload' && upload ? guessYearKey(upload.headers) : 'year'
  const availableVars =
    tab === 'upload' && upload
      ? upload.headers.filter((h) => h !== yearKey && activeRows.some((r) => Number.isFinite(Number(r[h]))))
      : STAT_VAR_DEFS.map((d) => d.id)

  const labelOf = (id) => s.varLabels[id] || id

  const numericSeries = useMemo(() => {
    const ids = selectedVars.filter((id) => availableVars.includes(id))
    if (tab === 'upload' && upload) {
      const map = {}
      for (const id of ids) map[id] = activeRows.map((r) => r[id])
      return map
    }
    return seriesMapFromRows(activeRows, ids)
  }, [selectedVars, availableVars, activeRows, tab, upload])

  const nObs = activeRows.length
  const warn = sampleSizeWarning(nObs, lang)

  const descriptives = useMemo(() => {
    const out = {}
    for (const [id, vals] of Object.entries(numericSeries)) out[id] = describeSeries(vals)
    return out
  }, [numericSeries])

  const corr = useMemo(() => correlationMatrix(numericSeries), [numericSeries])

  const years = activeRows.map((r) => Number(r[yearKey] ?? r.year)).filter((y) => Number.isFinite(y))

  const trend = useMemo(() => {
    if (!selectedVars[0] || !numericSeries[selectedVars[0]]) return null
    const vals = numericSeries[selectedVars[0]]
    if (years.length === vals.length) return timeTrend(years, vals)
    return timeTrend(
      vals.map((_, i) => i + 1),
      vals,
    )
  }, [numericSeries, selectedVars, years])

  const simpleReg = useMemo(() => {
    if (!numericSeries[yVar] || !numericSeries[xVar]) return { ok: false }
    return simpleRegression(numericSeries[xVar], numericSeries[yVar])
  }, [numericSeries, yVar, xVar])

  const multiReg = useMemo(() => {
    if (!numericSeries[yVar]) return { ok: false }
    const predIds = xVars.filter((id) => id !== yVar && numericSeries[id])
    const preds = predIds.map((id) => numericSeries[id])
    if (!preds.length) return { ok: false }
    return { ...multipleRegression(numericSeries[yVar], preds), predIds }
  }, [numericSeries, yVar, xVars])

  const multiCompanies = useMemo(() => buildMultiCompanySeries(user.id, compareVar), [user.id, compareVar])
  const anovaCompare = useMemo(() => oneWayAnova(multiCompanies.map((c) => c.values)), [multiCompanies])
  const mwCompare = useMemo(() => {
    if (multiCompanies.length < 2) return { ok: false }
    return mannWhitneyU(multiCompanies[0].values, multiCompanies[1].values)
  }, [multiCompanies])

  const sessions = company ? listStatsSessions(user.id, company.id) : []
  void sessionsTick

  if (!company) return <NeedCompanyNotice t={t} />

  const toggleVar = (id) => {
    setSelectedVars((prev) => {
      if (prev.includes(id)) return prev.length === 1 ? prev : prev.filter((x) => x !== id)
      return [...prev, id]
    })
  }

  const chartTrend = (trend?.points || []).map((p, i) => ({
    year: p.year,
    value: p.value,
    ma: trend.movingAvg[i],
    fit: trend.regression?.ok ? trend.regression.intercept + trend.regression.slope * p.year : null,
  }))

  const scatterData = simpleReg.ok
    ? simpleReg.xs.map((x, i) => ({ x, y: simpleReg.ys[i], fit: simpleReg.fitted[i] }))
    : []

  const empty = !companyRows.length && (tab === 'company' || tab === 'templates')

  return (
    <section className="analysis-page stats-page">
      <header className="analysis-page__head deep-reading__head">
        <div className="analysis-page__intro">
          <p className="fin-kicker">{s.kicker}</p>
          <h1 className="analysis-page__title">{s.title}</h1>
          <p className="analysis-page__lead">{s.lead}</p>
          <p className="deep-reading__meta">
            {s.n} = {nObs}
          </p>
        </div>
        <button
          type="button"
          className="deep-reading-cta"
          onClick={() => {
            saveStatsSession(user.id, company.id, {
              title: `${tab} · ${selectedVars.join(',')}`,
              tab,
              selectedVars,
              yVar,
              xVar,
              xVars,
              compareVar,
            })
            setFlash(s.saved)
            setSessionsTick((v) => v + 1)
            window.setTimeout(() => setFlash(''), 2000)
          }}
        >
          {s.saveSession}
        </button>
      </header>

      {flash && (
        <p className="company-form__flash" role="status">
          {flash}
        </p>
      )}
      {warn && (
        <p className="stats-warn" role="status">
          {warn}
        </p>
      )}
      <p className="stats-method">{s.methodNote}</p>

      <div className="stats-tabs" role="tablist">
        {[
          ['company', s.tabCompany],
          ['upload', s.tabUpload],
          ['templates', s.tabTemplates],
          ['compare', s.tabCompare],
          ['sessions', s.tabSessions],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={`stats-tab ${tab === id ? 'is-active' : ''}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'templates' && (
        <div className="deep-panel">
          <div className="deep-presets">
            {[
              ['liquidity', s.templateLiquidity],
              ['profitability', s.templateProfit],
              ['financing', s.templateFinance],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                className="deep-preset"
                onClick={() => {
                  const tpl = STAT_TEMPLATES[key]
                  setSelectedVars(tpl.vars)
                  setYVar(tpl.y)
                  setXVar(tpl.x[0])
                  setXVars(tpl.x)
                  setTab('company')
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === 'upload' && (
        <div className="deep-panel">
          <p>{s.uploadHint}</p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              try {
                const parsed = await loadTabularUpload(file)
                setUpload(parsed)
                const yk = guessYearKey(parsed.headers)
                const nums = parsed.headers.filter((h) => h !== yk)
                setSelectedVars(nums.slice(0, 5))
                if (nums[0]) setYVar(nums[0])
                if (nums[1]) {
                  setXVar(nums[1])
                  setXVars(nums.slice(1, 3))
                }
              } catch {
                setUpload(null)
              }
              e.target.value = ''
            }}
          />
          <button type="button" className="deep-reading-cta" onClick={() => fileRef.current?.click()}>
            {s.uploadBtn}
          </button>
          {upload && (
            <p className="deep-reading__meta">
              {upload.source.toUpperCase()} · {upload.rows.length} × {upload.headers.length}
            </p>
          )}
        </div>
      )}

      {tab === 'sessions' && (
        <div className="deep-panel">
          <ul className="stats-session-list">
            {sessions.map((sess) => (
              <li key={sess.id}>
                <span>
                  {new Date(sess.createdAt).toLocaleString(lang === 'ar' ? 'ar-DZ' : 'fr-FR')} — {sess.title}
                </span>
                <span className="stats-session-actions">
                  <button
                    type="button"
                    className="deep-preset"
                    onClick={() => {
                      setTab(sess.tab || 'company')
                      if (sess.selectedVars) setSelectedVars(sess.selectedVars)
                      if (sess.yVar) setYVar(sess.yVar)
                      if (sess.xVar) setXVar(sess.xVar)
                      if (sess.xVars) setXVars(sess.xVars)
                      if (sess.compareVar) setCompareVar(sess.compareVar)
                    }}
                  >
                    {s.loadSession}
                  </button>
                  <button
                    type="button"
                    className="deep-preset"
                    onClick={() => {
                      removeStatsSession(user.id, company.id, sess.id)
                      setSessionsTick((v) => v + 1)
                    }}
                  >
                    {s.deleteSession}
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'compare' && (
        <div className="deep-panel">
          <div className="deep-panel__head">
            <SectionTitle title={s.tabCompare} sectionId="compare" lang={lang} closeLabel={closeLabel} />
          </div>
          <label className="stats-field">
            <span>{s.compareVar}</span>
            <DarkSelect
              className="dark-select--compact"
              value={compareVar}
              onChange={(e) => setCompareVar(e.target.value)}
              aria-label={s.compareVar}
              options={STAT_VAR_DEFS.map((d) => ({ value: d.id, label: labelOf(d.id) }))}
            />
          </label>
          {!multiCompanies.length ? (
            <p>{s.noCompanies}</p>
          ) : (
            <>
              <div className="deep-chart" dir="ltr">
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart
                    data={(() => {
                      const allYears = [...new Set(multiCompanies.flatMap((c) => c.years))].sort(
                        (a, b) => Number(a) - Number(b),
                      )
                      return allYears.map((year) => {
                        const row = { year }
                        multiCompanies.forEach((co) => {
                          const i = co.years.findIndex((y) => String(y) === String(year))
                          row[co.companyId] = i >= 0 ? co.values[i] : null
                        })
                        return row
                      })
                    })()}
                  >
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 6" />
                    <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    {multiCompanies.map((co, idx) => (
                      <Line
                        key={co.companyId}
                        type="monotone"
                        dataKey={co.companyId}
                        name={co.name}
                        stroke={COMPARE_COLORS[idx % COMPARE_COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="deep-table-wrap">
                <table className="deep-table">
                  <thead>
                    <tr>
                      <th>{s.compareVar}</th>
                      <th>{s.n}</th>
                      <th>{s.mean}</th>
                      <th>{s.stdev}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {multiCompanies.map((co) => {
                      const d = describeSeries(co.values)
                      return (
                        <tr key={co.companyId}>
                          <td>{co.name}</td>
                          <td>{d.n}</td>
                          <td>{fmt(d.mean, lang)}</td>
                          <td>{fmt(d.stdev, lang)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {anovaCompare.ok && (
                <p className="stats-method">
                  ANOVA F = {fmt(anovaCompare.F, lang)} (df {anovaCompare.dfb}; {anovaCompare.dfw})
                </p>
              )}
              {mwCompare.ok && (
                <p className="stats-method">
                  Mann–Whitney U = {fmt(mwCompare.U, lang, 2)} · z ≈ {fmt(mwCompare.z, lang)}
                </p>
              )}
            </>
          )}
        </div>
      )}

      {(tab === 'company' || tab === 'upload' || tab === 'templates') && (
        <div className="stats-stage">
          {empty ? (
            <div className="dash-empty-state">
              <p>{s.empty}</p>
            </div>
          ) : (
            <>
              <section className="deep-panel">
                <div className="deep-panel__head">
                  <h2>{s.vars}</h2>
                </div>
                <div className="deep-vars">
                  {availableVars.map((id) => (
                    <button
                      key={id}
                      type="button"
                      className={`deep-var ${selectedVars.includes(id) ? 'is-on' : ''}`}
                      style={{ '--deep-var-color': '#d4af37' }}
                      onClick={() => toggleVar(id)}
                    >
                      <span className="deep-var__swatch" />
                      {labelOf(id)}
                    </button>
                  ))}
                </div>
              </section>

              <section className="deep-panel">
                <div className="deep-panel__head">
                  <SectionTitle title={s.descriptive} sectionId="descriptive" lang={lang} closeLabel={closeLabel} />
                </div>
                <div className="deep-table-wrap">
                  <table className="deep-table">
                    <thead>
                      <tr>
                        <th>{s.vars}</th>
                        <th>{s.n}</th>
                        <th>{s.mean}</th>
                        <th>{s.median}</th>
                        <th>{s.stdev}</th>
                        <th>{s.min}</th>
                        <th>{s.max}</th>
                        <th>{s.cv}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(descriptives).map(([id, d]) => (
                        <tr key={id}>
                          <td>{labelOf(id)}</td>
                          <td>{d.n}</td>
                          <td>{fmt(d.mean, lang)}</td>
                          <td>{fmt(d.median, lang)}</td>
                          <td>{fmt(d.stdev, lang)}</td>
                          <td>{fmt(d.min, lang)}</td>
                          <td>{fmt(d.max, lang)}</td>
                          <td>{fmt(d.cv, lang)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="deep-panel">
                <div className="deep-panel__head">
                  <SectionTitle title={s.correlation} sectionId="correlation" lang={lang} closeLabel={closeLabel} />
                </div>
                <div className="deep-table-wrap">
                  <table className="deep-table">
                    <thead>
                      <tr>
                        <th>—</th>
                        {corr.keys.map((k) => (
                          <th key={k}>{labelOf(k)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {corr.keys.map((a) => (
                        <tr key={a}>
                          <td>{labelOf(a)}</td>
                          {corr.keys.map((b) => (
                            <td key={b} title={corr.matrix[a][b].pValue != null ? `p≈${fmt(corr.matrix[a][b].pValue, lang)}` : ''}>
                              {fmt(corr.matrix[a][b].r, lang, 3)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="deep-panel">
                <div className="deep-panel__head">
                  <h2>{s.trend}</h2>
                </div>
                <div className="deep-chart" dir="ltr">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartTrend}>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 6" />
                      <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="value" name={labelOf(selectedVars[0] || '')} stroke="#d4af37" strokeWidth={2.4} />
                      <Line type="monotone" dataKey="ma" name="MA" stroke="#38bdf8" strokeDasharray="4 4" />
                      <Line type="monotone" dataKey="fit" name="Trend" stroke="#34d399" strokeDasharray="2 4" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="deep-panel">
                <div className="deep-panel__head">
                  <SectionTitle title={s.regression} sectionId="regression" lang={lang} closeLabel={closeLabel} />
                </div>
                <div className="stats-reg-controls">
                  <label className="stats-field">
                    <span>{s.yVar}</span>
                    <DarkSelect
                      className="dark-select--compact"
                      value={yVar}
                      onChange={(e) => setYVar(e.target.value)}
                      aria-label={s.yVar}
                      options={availableVars.map((id) => ({ value: id, label: labelOf(id) }))}
                    />
                  </label>
                  <label className="stats-field">
                    <span>{s.xVar}</span>
                    <DarkSelect
                      className="dark-select--compact"
                      value={xVar}
                      onChange={(e) => setXVar(e.target.value)}
                      aria-label={s.xVar}
                      options={availableVars.map((id) => ({ value: id, label: labelOf(id) }))}
                    />
                  </label>
                </div>
                {simpleReg.ok ? (
                  <>
                    <p className="stats-method">
                      {s.slope} = {fmt(simpleReg.slope, lang)} · {s.intercept} = {fmt(simpleReg.intercept, lang)} · {s.r2}{' '}
                      = {fmt(simpleReg.r2, lang)} · {s.dw} = {fmt(simpleReg.durbinWatson, lang)} · p(β) ≈{' '}
                      {fmt(simpleReg.pSlope, lang)}
                    </p>
                    <div className="deep-chart" dir="ltr">
                      <ResponsiveContainer width="100%" height={280}>
                        <ScatterChart>
                          <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                          <XAxis dataKey="x" name="X" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                          <YAxis dataKey="y" name="Y" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                          <ZAxis range={[60, 60]} />
                          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                          <Scatter name="obs" data={scatterData} fill="#d4af37" />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                    <h3 className="stats-subhead">{s.residual}</h3>
                    <div className="deep-table-wrap">
                      <table className="deep-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>eᵢ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {simpleReg.residuals.map((e, i) => (
                            <tr key={i}>
                              <td>{i + 1}</td>
                              <td>{fmt(e, lang)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <p className="stats-method">n &lt; 3</p>
                )}
              </section>

              <section className="deep-panel">
                <div className="deep-panel__head">
                  <SectionTitle title={s.multiReg} sectionId="multiReg" lang={lang} closeLabel={closeLabel} />
                </div>
                <div className="deep-vars">
                  {availableVars
                    .filter((id) => id !== yVar)
                    .map((id) => (
                      <button
                        key={id}
                        type="button"
                        className={`deep-var ${xVars.includes(id) ? 'is-on' : ''}`}
                        style={{ '--deep-var-color': '#38bdf8' }}
                        onClick={() =>
                          setXVars((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
                        }
                      >
                        <span className="deep-var__swatch" />
                        {labelOf(id)}
                      </button>
                    ))}
                </div>
                {multiReg.ok ? (
                  <p className="stats-method">
                    {s.intercept} = {fmt(multiReg.intercept, lang)} ·{' '}
                    {(multiReg.predIds || xVars).map((id, i) => `${labelOf(id)}: ${fmt(multiReg.coefficients[i], lang)}`).join(' · ')}{' '}
                    · {s.r2} = {fmt(multiReg.r2, lang)} · {s.adjR2} = {fmt(multiReg.adjR2, lang)} · {s.dw} ={' '}
                    {fmt(multiReg.durbinWatson, lang)}
                  </p>
                ) : (
                  <p className="stats-method">n / k insufficient</p>
                )}
              </section>

              <section className="deep-panel">
                <div className="deep-table-wrap">
                  <table className="deep-table">
                    <thead>
                      <tr>
                        <th>{yearKey}</th>
                        {selectedVars.map((id) => (
                          <th key={id}>{labelOf(id)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...activeRows].reverse().map((row, idx) => (
                        <tr key={String(row.year ?? idx)}>
                          <td>{row[yearKey] ?? row.year}</td>
                          {selectedVars.map((id) => (
                            <td key={id}>{fmt(row[id], lang, 3)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="stats-method">{s.formulaNote}</p>
                <p className="stats-method">{s.exportNote}</p>
              </section>
            </>
          )}
        </div>
      )}
    </section>
  )
}
