import { computeFundamentals } from './analysisEngine'
import { listCompanies } from './companyStore'
import { listYears, loadFinancial } from './financialStore'
import { computeStructureMetrics } from './structureMetrics'

/** Variable catalog for statistical analysis (company fiscal series). */
export const STAT_VAR_DEFS = [
  { id: 'liquidity', group: 'structure', from: 'structure' },
  { id: 'frng', group: 'structure', from: 'structure' },
  { id: 'bfr', group: 'structure', from: 'structure' },
  { id: 'tresorerie', group: 'structure', from: 'structure' },
  { id: 'shareEquity', group: 'structure', from: 'structure' },
  { id: 'shareDebt', group: 'structure', from: 'structure' },
  { id: 'totalActif', group: 'structure', from: 'structure' },
  { id: 'currentRatio', group: 'liquidity', from: 'fundamentals', path: ['liquidity', 'currentRatio'] },
  { id: 'quickRatio', group: 'liquidity', from: 'fundamentals', path: ['liquidity', 'quickRatio'] },
  { id: 'debtRatio', group: 'solvency', from: 'fundamentals', path: ['solvency', 'debtRatio'] },
  { id: 'roe', group: 'profitability', from: 'fundamentals', path: ['profitability', 'roe'] },
  { id: 'roa', group: 'profitability', from: 'fundamentals', path: ['profitability', 'roa'] },
  { id: 'netMargin', group: 'profitability', from: 'fundamentals', path: ['profitability', 'netMargin'] },
]

function dig(obj, path) {
  return path.reduce((acc, key) => (acc == null ? null : acc[key]), obj)
}

export function buildCompanyYearSeries(userId, companyId) {
  const years = listYears(userId, companyId)
  const rows = []
  for (const year of years) {
    const data = loadFinancial(userId, year, companyId)
    const structure = computeStructureMetrics(data.bilanRows)
    if (structure.empty) continue
    const f = computeFundamentals({ bilanRows: data.bilanRows, tcrAmounts: data.tcrAmounts })
    const row = { year, companyId }
    for (const def of STAT_VAR_DEFS) {
      if (def.from === 'structure') row[def.id] = structure[def.id]
      else row[def.id] = dig(f, def.path)
    }
    rows.push(row)
  }
  return rows.sort((a, b) => Number(a.year) - Number(b.year))
}

export function seriesMapFromRows(rows, varIds) {
  const map = {}
  for (const id of varIds) {
    map[id] = rows.map((r) => r[id])
  }
  return map
}

export const STAT_TEMPLATES = {
  liquidity: {
    vars: ['liquidity', 'currentRatio', 'quickRatio', 'tresorerie'],
    y: 'liquidity',
    x: ['shareEquity'],
  },
  profitability: {
    vars: ['roe', 'roa', 'netMargin', 'totalActif'],
    y: 'roe',
    x: ['roa', 'netMargin'],
  },
  financing: {
    vars: ['frng', 'bfr', 'tresorerie', 'shareEquity', 'shareDebt'],
    y: 'tresorerie',
    x: ['frng', 'bfr'],
  },
}

export function buildMultiCompanySeries(userId, varId) {
  const companies = listCompanies(userId)
  return companies
    .map((co) => {
      const rows = buildCompanyYearSeries(userId, co.id)
      return {
        companyId: co.id,
        name: co.name,
        years: rows.map((r) => r.year),
        values: rows.map((r) => r[varId]),
        rows,
      }
    })
    .filter((c) => c.values.some((v) => v != null && Number.isFinite(Number(v))))
}

function parseCsv(text) {
  const lines = String(text)
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((l) => l.trim())
  if (!lines.length) throw new Error('EMPTY_FILE')
  const headers = splitCsvLine(lines[0]).map((h) => h.trim())
  const rows = lines.slice(1).map((line) => {
    const cells = splitCsvLine(line)
    const obj = {}
    headers.forEach((h, i) => {
      const raw = cells[i] ?? ''
      const num = Number(String(raw).replace(/\s/g, '').replace(',', '.'))
      obj[h] = Number.isFinite(num) && String(raw).trim() !== '' ? num : raw
    })
    return obj
  })
  return { headers, rows, source: 'csv' }
}

function splitCsvLine(line) {
  const out = []
  let cur = ''
  let q = false
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    if (ch === '"') {
      q = !q
      continue
    }
    if (ch === ',' && !q) {
      out.push(cur)
      cur = ''
      continue
    }
    cur += ch
  }
  out.push(cur)
  return out
}

async function parseXlsx(buffer) {
  const XLSX = await import('xlsx')
  const wb = XLSX.read(buffer, { type: 'array' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
  if (!aoa.length) throw new Error('EMPTY_FILE')
  const headers = aoa[0].map((h) => String(h).trim())
  const rows = aoa
    .slice(1)
    .filter((r) => r.some((c) => String(c).trim() !== ''))
    .map((cells) => {
      const obj = {}
      headers.forEach((h, i) => {
        const raw = cells[i]
        const num = Number(raw)
        obj[h] = typeof raw === 'number' ? raw : Number.isFinite(num) && String(raw).trim() !== '' ? num : raw
      })
      return obj
    })
  return { headers, rows, source: 'xlsx' }
}

export async function loadTabularUpload(file) {
  const name = file.name || 'upload'
  if (name.toLowerCase().endsWith('.csv')) {
    const text = await file.text()
    return parseCsv(text)
  }
  const buf = await file.arrayBuffer()
  return parseXlsx(buf)
}
