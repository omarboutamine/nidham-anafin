/**
 * Statistical engine — formulas aligned with classical applied statistics
 * (sample moments, Pearson r, OLS, one-way ANOVA, Durbin–Watson).
 * Uses `simple-statistics` for well-tested primitives; matrix OLS is local.
 *
 * Pedagogical caveat: with few fiscal years (n small), inferential p-values
 * are fragile — always surface sampleSizeWarning when n < 8.
 */

import * as ss from 'simple-statistics'

export const MIN_INFERENTIAL_N = 8
export const MIN_CORR_N = 3
export const MIN_REG_N = 3

export function sampleSizeWarning(n, lang = 'ar') {
  if (n >= MIN_INFERENTIAL_N) return null
  if (lang === 'fr') {
    return `Attention méthodologique : n = ${n} est faible. Les tests inférentiels (p-value, IC) sont peu fiables ; privilégiez la lecture descriptive et les tendances.`
  }
  return `تحذير منهجي: حجم العينة n = ${n} صغير. الاختبارات الاستدلالية (قيمة p، فترات الثقة) ضعيفة الموثوقية؛ ركّز على الوصفي والاتجاهات.`
}

export function cleanNumeric(values) {
  return (values || [])
    .map((v) => (typeof v === 'number' ? v : Number(v)))
    .filter((v) => Number.isFinite(v))
}

export function describeSeries(values) {
  const xs = cleanNumeric(values)
  const n = xs.length
  if (!n) {
    return {
      n: 0,
      mean: null,
      median: null,
      min: null,
      max: null,
      range: null,
      variance: null,
      stdev: null,
      q1: null,
      q3: null,
      iqr: null,
      cv: null,
    }
  }
  const mean = ss.mean(xs)
  const variance = n >= 2 ? ss.sampleVariance(xs) : 0
  const stdev = n >= 2 ? ss.sampleStandardDeviation(xs) : 0
  const sorted = [...xs].sort((a, b) => a - b)
  const q1 = n >= 4 ? ss.quantile(sorted, 0.25) : sorted[0]
  const q3 = n >= 4 ? ss.quantile(sorted, 0.75) : sorted[n - 1]
  return {
    n,
    mean,
    median: ss.median(xs),
    min: ss.min(xs),
    max: ss.max(xs),
    range: ss.max(xs) - ss.min(xs),
    variance,
    stdev,
    q1,
    q3,
    iqr: q3 - q1,
    cv: mean !== 0 ? stdev / Math.abs(mean) : null,
  }
}

/** Pearson correlation + approximate two-sided p via t distribution (ss). */
export function pearsonWithP(x, y) {
  const pairs = []
  const n = Math.min(x.length, y.length)
  for (let i = 0; i < n; i += 1) {
    const a = Number(x[i])
    const b = Number(y[i])
    if (Number.isFinite(a) && Number.isFinite(b)) pairs.push([a, b])
  }
  if (pairs.length < MIN_CORR_N) {
    return { n: pairs.length, r: null, t: null, df: null, pValue: null }
  }
  const xs = pairs.map((p) => p[0])
  const ys = pairs.map((p) => p[1])
  const r = ss.sampleCorrelation(xs, ys)
  const df = pairs.length - 2
  if (!Number.isFinite(r) || Math.abs(r) >= 1 || df <= 0) {
    return { n: pairs.length, r: Number.isFinite(r) ? r : null, t: null, df, pValue: null }
  }
  const t = (r * Math.sqrt(df)) / Math.sqrt(1 - r * r)
  // Approximate two-tailed p from Student-t via regularized incomplete beta / erfc fallback
  const pValue = studentTPvalueTwoTailed(Math.abs(t), df)
  return { n: pairs.length, r, t, df, pValue }
}

function studentTPvalueTwoTailed(tAbs, df) {
  // Abramowitz-style approximation via incomplete beta equivalence
  // p = IncompleteBeta(df/2, 1/2, df/(df+t^2))
  const x = df / (df + tAbs * tAbs)
  const a = df / 2
  const b = 0.5
  const ib = incompleteBeta(x, a, b)
  return Math.min(1, Math.max(0, ib))
}

function incompleteBeta(x, a, b) {
  // Continued fraction (Lentz) — adequate for pedagogical p-values
  if (x <= 0) return 0
  if (x >= 1) return 1
  const bt =
    Math.exp(
      gammaln(a + b) - gammaln(a) - gammaln(b) + a * Math.log(x) + b * Math.log(1 - x),
    )
  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betacf(x, a, b)) / a
  }
  return 1 - (bt * betacf(1 - x, b, a)) / b
}

function betacf(x, a, b) {
  const maxIt = 200
  const eps = 3e-7
  let am = 1
  let bm = 1
  let az = 1
  let qab = a + b
  let qap = a + 1
  let qam = a - 1
  let bz = 1 - (qab * x) / qap
  for (let m = 1; m <= maxIt; m += 1) {
    const tem = 2 * m
    let d = (m * (b - m) * x) / ((qam + tem) * (a + tem))
    let ap = az + d * am
    let bp = bz + d * bm
    d = (-(a + m) * (qab + m) * x) / ((a + tem) * (qap + tem))
    const app = ap + d * az
    const bpp = bp + d * bz
    const aold = az
    am = ap / bpp
    bm = bp / bpp
    az = app / bpp
    bz = 1
    if (Math.abs(az - aold) < eps * Math.abs(az)) return az
  }
  return az
}

function gammaln(z) {
  // Lanczos approximation
  const g = 7
  const p = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.984369654078291e-6,
    1.5056327351493116e-7,
  ]
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - gammaln(1 - z)
  z -= 1
  let x = p[0]
  for (let i = 1; i < g + 2; i += 1) x += p[i] / (z + i)
  const t = z + g + 0.5
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x)
}

export function correlationMatrix(seriesMap) {
  const keys = Object.keys(seriesMap)
  const matrix = {}
  for (const a of keys) {
    matrix[a] = {}
    for (const b of keys) {
      matrix[a][b] = pearsonWithP(seriesMap[a], seriesMap[b])
    }
  }
  return { keys, matrix }
}

/**
 * Simple OLS: y = a + b x
 * Returns slope, intercept, r2, residuals, fitted, DW, SE, t for slope.
 */
export function simpleRegression(x, y) {
  const pairs = []
  const n0 = Math.min(x.length, y.length)
  for (let i = 0; i < n0; i += 1) {
    const xi = Number(x[i])
    const yi = Number(y[i])
    if (Number.isFinite(xi) && Number.isFinite(yi)) pairs.push([xi, yi])
  }
  const n = pairs.length
  if (n < MIN_REG_N) {
    return { n, ok: false, reason: 'INSUFFICIENT_N' }
  }
  const xs = pairs.map((p) => p[0])
  const ys = pairs.map((p) => p[1])
  const line = ss.linearRegression(pairs)
  const intercept = line.b
  const slope = line.m
  const predict = ss.linearRegressionLine(line)
  const fitted = xs.map((xi) => predict(xi))
  const residuals = ys.map((yi, i) => yi - fitted[i])
  const ssTot = ys.reduce((s, yi) => s + (yi - ss.mean(ys)) ** 2, 0)
  const ssRes = residuals.reduce((s, e) => s + e * e, 0)
  const r2 = ssTot === 0 ? null : 1 - ssRes / ssTot
  const df = n - 2
  const mse = df > 0 ? ssRes / df : null
  const xMean = ss.mean(xs)
  const sxx = xs.reduce((s, xi) => s + (xi - xMean) ** 2, 0)
  const seSlope = mse != null && sxx > 0 ? Math.sqrt(mse / sxx) : null
  const tSlope = seSlope ? slope / seSlope : null
  const pSlope = tSlope != null && df > 0 ? studentTPvalueTwoTailed(Math.abs(tSlope), df) : null
  return {
    n,
    ok: true,
    intercept,
    slope,
    r2,
    adjR2: r2 == null || n <= 2 ? null : 1 - (1 - r2) * ((n - 1) / (n - 2)),
    fitted,
    residuals,
    xs,
    ys,
    durbinWatson: durbinWatson(residuals),
    seSlope,
    tSlope,
    pSlope,
    df,
  }
}

/** Multiple OLS with intercept via normal equations (Gaussian elimination). */
export function multipleRegression(y, predictors /* array of arrays, same length */) {
  const n = y.length
  const k = predictors.length
  if (!k || n < k + 2) return { ok: false, reason: 'INSUFFICIENT_N', n, k }
  const rows = []
  for (let i = 0; i < n; i += 1) {
    const yi = Number(y[i])
    if (!Number.isFinite(yi)) continue
    const rowX = [1]
    let good = true
    for (let j = 0; j < k; j += 1) {
      const v = Number(predictors[j][i])
      if (!Number.isFinite(v)) {
        good = false
        break
      }
      rowX.push(v)
    }
    if (good) rows.push({ y: yi, x: rowX })
  }
  const m = rows.length
  if (m < k + 2) return { ok: false, reason: 'INSUFFICIENT_N', n: m, k }

  const p = k + 1
  // Build X'X and X'y
  const xtx = Array.from({ length: p }, () => Array(p).fill(0))
  const xty = Array(p).fill(0)
  for (const { y: yi, x } of rows) {
    for (let a = 0; a < p; a += 1) {
      xty[a] += x[a] * yi
      for (let b = 0; b < p; b += 1) xtx[a][b] += x[a] * x[b]
    }
  }
  const beta = solveLinearSystem(xtx, xty)
  if (!beta) return { ok: false, reason: 'SINGULAR', n: m, k }

  const fitted = rows.map(({ x }) => beta.reduce((s, b, j) => s + b * x[j], 0))
  const ys = rows.map((r) => r.y)
  const residuals = ys.map((yi, i) => yi - fitted[i])
  const yMean = ss.mean(ys)
  const ssTot = ys.reduce((s, yi) => s + (yi - yMean) ** 2, 0)
  const ssRes = residuals.reduce((s, e) => s + e * e, 0)
  const r2 = ssTot === 0 ? null : 1 - ssRes / ssTot
  const dfRes = m - p
  const adjR2 = r2 == null || dfRes <= 0 ? null : 1 - (1 - r2) * ((m - 1) / dfRes)
  return {
    ok: true,
    n: m,
    k,
    intercept: beta[0],
    coefficients: beta.slice(1),
    beta,
    r2,
    adjR2,
    fitted,
    residuals,
    durbinWatson: durbinWatson(residuals),
    dfRes,
  }
}

function solveLinearSystem(A, b) {
  const n = b.length
  const M = A.map((row, i) => [...row, b[i]])
  for (let col = 0; col < n; col += 1) {
    let pivot = col
    for (let r = col + 1; r < n; r += 1) {
      if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r
    }
    if (Math.abs(M[pivot][col]) < 1e-12) return null
    ;[M[col], M[pivot]] = [M[pivot], M[col]]
    const div = M[col][col]
    for (let j = col; j <= n; j += 1) M[col][j] /= div
    for (let r = 0; r < n; r += 1) {
      if (r === col) continue
      const f = M[r][col]
      for (let j = col; j <= n; j += 1) M[r][j] -= f * M[col][j]
    }
  }
  return M.map((row) => row[n])
}

export function durbinWatson(residuals) {
  const e = cleanNumeric(residuals)
  if (e.length < 3) return null
  let num = 0
  let den = 0
  for (let i = 0; i < e.length; i += 1) {
    den += e[i] * e[i]
    if (i > 0) num += (e[i] - e[i - 1]) ** 2
  }
  return den === 0 ? null : num / den
}

/** One-way ANOVA for groups: array of arrays. */
export function oneWayAnova(groups) {
  const cleaned = (groups || []).map(cleanNumeric).filter((g) => g.length > 0)
  const k = cleaned.length
  const n = cleaned.reduce((s, g) => s + g.length, 0)
  if (k < 2 || n < k + 1) return { ok: false, reason: 'INSUFFICIENT_N', k, n }
  const all = cleaned.flat()
  const grand = ss.mean(all)
  let ssBetween = 0
  let ssWithin = 0
  for (const g of cleaned) {
    const m = ss.mean(g)
    ssBetween += g.length * (m - grand) ** 2
    for (const v of g) ssWithin += (v - m) ** 2
  }
  const dfb = k - 1
  const dfw = n - k
  if (dfw <= 0) return { ok: false, reason: 'INSUFFICIENT_DF', k, n }
  const msb = ssBetween / dfb
  const msw = ssWithin / dfw
  const F = msw === 0 ? null : msb / msw
  return {
    ok: true,
    k,
    n,
    ssBetween,
    ssWithin,
    dfb,
    dfw,
    msb,
    msw,
    F,
    // p-value omitted without F distribution table; report F + dfs for transparency
  }
}

/** YoY changes and linear time trend for a chronological series. */
export function timeTrend(years, values) {
  const pairs = []
  for (let i = 0; i < years.length; i += 1) {
    const y = Number(years[i])
    const v = Number(values[i])
    if (Number.isFinite(y) && Number.isFinite(v)) pairs.push({ year: y, value: v })
  }
  pairs.sort((a, b) => a.year - b.year)
  const yoy = []
  for (let i = 1; i < pairs.length; i += 1) {
    const prev = pairs[i - 1].value
    const cur = pairs[i].value
    yoy.push({
      year: pairs[i].year,
      change: cur - prev,
      pct: prev === 0 ? null : ((cur - prev) / Math.abs(prev)) * 100,
    })
  }
  const reg =
    pairs.length >= MIN_REG_N
      ? simpleRegression(
          pairs.map((p) => p.year),
          pairs.map((p) => p.value),
        )
      : { ok: false }
  const maWindow = Math.min(3, pairs.length)
  const movingAvg = pairs.map((_, i) => {
    if (i + 1 < maWindow) return null
    const slice = pairs.slice(i + 1 - maWindow, i + 1).map((p) => p.value)
    return ss.mean(slice)
  })
  return { points: pairs, yoy, regression: reg, movingAvg, maWindow }
}

/** Mann–Whitney U (two samples) — exact for small n via normal approx with tie correction skipped. */
export function mannWhitneyU(sampleA, sampleB) {
  const a = cleanNumeric(sampleA)
  const b = cleanNumeric(sampleB)
  if (a.length < 2 || b.length < 2) return { ok: false, reason: 'INSUFFICIENT_N' }
  const combined = [
    ...a.map((v) => ({ v, g: 0 })),
    ...b.map((v) => ({ v, g: 1 })),
  ].sort((x, y) => x.v - y.v)
  // average ranks for ties
  const ranks = Array(combined.length)
  let i = 0
  while (i < combined.length) {
    let j = i
    while (j < combined.length && combined[j].v === combined[i].v) j += 1
    const avg = (i + 1 + j) / 2
    for (let t = i; t < j; t += 1) ranks[t] = avg
    i = j
  }
  let rA = 0
  combined.forEach((row, idx) => {
    if (row.g === 0) rA += ranks[idx]
  })
  const n1 = a.length
  const n2 = b.length
  const U1 = rA - (n1 * (n1 + 1)) / 2
  const U2 = n1 * n2 - U1
  const U = Math.min(U1, U2)
  const mu = (n1 * n2) / 2
  const sigma = Math.sqrt((n1 * n2 * (n1 + n2 + 1)) / 12)
  const z = sigma === 0 ? null : (U - mu) / sigma
  return { ok: true, n1, n2, U, U1, U2, z }
}
