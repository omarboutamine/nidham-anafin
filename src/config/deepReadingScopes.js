import { buildMarketMetricInfo } from './marketMetricReadings'
import { buildStructureMetricInfo } from './structureMetricReadings'
import { computeFundamentals } from '../services/analysisEngine'
import { listYears, loadFinancial } from '../services/financialStore'
import { computeStructureMetrics } from '../services/structureMetrics'

/**
 * Deep-reading scopes: indicators linked per analysis page + multi-year horizontal view.
 * `structure` = existing SCF structure page; others = market modules.
 */

function v(id, scale, color, marketId, labelKey, labelFrom = 'modules') {
  return { id, scale, color, marketId: marketId || id, labelKey: labelKey || id, labelFrom }
}

export const DEEP_SCOPES = {
  structure: {
    kind: 'structure',
    backPath: '/dashboard/analyse-structure',
    titleKey: 'deepReadingTitle',
    leadKey: 'deepReadingLead',
    vars: [
      v('frng', 'money', '#d4af37', 'frng', 'frng', 'analysis'),
      v('bfr', 'money', '#38bdf8', 'bfr', 'bfr', 'analysis'),
      v('tresorerie', 'money', '#34d399', 'treasuryNet', 'treasuryNet', 'analysis'),
      v('totalActif', 'money', '#a78bfa', 'totalActif', 'totalActif', 'analysis'),
      v('totalPassif', 'money', '#f472b6', 'totalPassif', 'totalPassif', 'analysis'),
      v('liquidity', 'ratio', '#fb923c', 'liquidity', 'liquidity', 'analysis'),
      v('shareCourant', 'pct', '#22d3ee', 'actifStructure', 'actifCourantShare', 'analysis'),
      v('shareNonCourant', 'pct', '#818cf8', 'actifStructure', 'actifNonCourantShare', 'analysis'),
      v('shareEquity', 'pct', '#4ade80', 'passifStructure', 'equityShare', 'analysis'),
      v('shareDebt', 'pct', '#f87171', 'passifStructure', 'debtShare', 'analysis'),
    ],
    presets: {
      balance: ['frng', 'bfr', 'tresorerie'],
      liquidity: ['liquidity', 'shareEquity', 'shareDebt'],
      size: ['totalActif', 'totalPassif'],
      composition: ['shareCourant', 'shareNonCourant', 'shareEquity'],
    },
    defaultPreset: 'balance',
    deltaKeys: ['frng', 'bfr', 'tresorerie', 'liquidity', 'shareEquity'],
    timelineKeys: ['liquidity', 'frng', 'bfr', 'treasuryNet'],
  },
  liquidity: {
    kind: 'market',
    backPath: '/dashboard/analyse/liquidite',
    moduleId: 'liquidity',
    vars: [
      v('currentRatio', 'ratio', '#d4af37', 'currentRatio', 'currentRatio'),
      v('quickRatio', 'ratio', '#38bdf8', 'quickRatio', 'quickRatio'),
      v('cashRatio', 'ratio', '#34d399', 'cashRatio', 'cashRatio'),
    ],
    presets: {
      all: ['currentRatio', 'quickRatio', 'cashRatio'],
      core: ['currentRatio', 'quickRatio'],
    },
    defaultPreset: 'all',
    deltaKeys: ['currentRatio', 'quickRatio', 'cashRatio'],
    timelineKeys: ['currentRatio', 'quickRatio', 'cashRatio'],
  },
  solvency: {
    kind: 'market',
    backPath: '/dashboard/analyse/solvabilite',
    moduleId: 'solvency',
    vars: [
      v('debtRatio', 'ratio', '#f87171', 'debtRatio', 'debtRatio'),
      v('equityRatio', 'ratio', '#4ade80', 'equityRatio', 'equityRatio'),
      v('gearing', 'ratio', '#fb923c', 'gearing', 'gearing'),
      v('autonomy', 'ratio', '#22d3ee', 'autonomy', 'autonomy'),
      v('coverage', 'ratio', '#a78bfa', 'coverage', 'coverage'),
      v('frng', 'money', '#d4af37', 'frng', 'frng'),
      v('bfr', 'money', '#38bdf8', 'bfr', 'bfr'),
      v('tresorerieNette', 'money', '#34d399', 'treasuryNet', 'treasuryNet'),
    ],
    presets: {
      ratios: ['debtRatio', 'equityRatio', 'gearing', 'autonomy', 'coverage'],
      balance: ['frng', 'bfr', 'tresorerieNette'],
      all: ['debtRatio', 'frng', 'bfr', 'tresorerieNette', 'autonomy'],
    },
    defaultPreset: 'balance',
    deltaKeys: ['debtRatio', 'frng', 'bfr', 'tresorerieNette', 'autonomy'],
    timelineKeys: ['debtRatio', 'frng', 'bfr', 'treasuryNet'],
  },
  profitability: {
    kind: 'market',
    backPath: '/dashboard/analyse/rentabilite',
    moduleId: 'profitability',
    vars: [
      v('netMargin', 'pct', '#d4af37', 'netMargin', 'netMargin'),
      v('operatingMargin', 'pct', '#38bdf8', 'opMargin', 'opMargin'),
      v('ebeMargin', 'pct', '#34d399', 'ebeMargin', 'ebeMargin'),
      v('roa', 'pct', '#a78bfa', 'roa', 'roa'),
      v('roe', 'pct', '#f472b6', 'roe', 'roe'),
    ],
    presets: {
      margins: ['netMargin', 'operatingMargin', 'ebeMargin'],
      returns: ['roa', 'roe'],
      all: ['netMargin', 'roa', 'roe'],
    },
    defaultPreset: 'all',
    deltaKeys: ['netMargin', 'roa', 'roe', 'operatingMargin'],
    timelineKeys: ['netMargin', 'roa', 'roe'],
  },
  activity: {
    kind: 'market',
    backPath: '/dashboard/analyse/activite',
    moduleId: 'activity',
    vars: [
      v('assetTurnover', 'ratio', '#d4af37', 'assetTurn', 'assetTurn'),
      v('inventoryTurnover', 'ratio', '#38bdf8', 'invTurn', 'invTurn'),
      v('receivablesTurnover', 'ratio', '#34d399', 'recTurn', 'recTurn'),
      v('dso', 'ratio', '#fb923c', 'dso', 'dso'),
      v('dio', 'ratio', '#a78bfa', 'dio', 'dio'),
    ],
    presets: {
      turns: ['assetTurnover', 'inventoryTurnover', 'receivablesTurnover'],
      delays: ['dso', 'dio'],
      all: ['assetTurnover', 'dso', 'dio'],
    },
    defaultPreset: 'all',
    deltaKeys: ['assetTurnover', 'dso', 'dio', 'inventoryTurnover'],
    timelineKeys: ['assetTurn', 'dso', 'dio'],
  },
  dupont: {
    kind: 'market',
    backPath: '/dashboard/analyse/dupont',
    moduleId: 'dupont',
    vars: [
      v('dupontMargin', 'pct', '#d4af37', 'dupontMargin', 'dupontMargin'),
      v('dupontTurn', 'ratio', '#38bdf8', 'dupontTurn', 'dupontTurn'),
      v('dupontLev', 'ratio', '#34d399', 'dupontLev', 'dupontLev'),
      v('dupontRoe', 'pct', '#f472b6', 'dupontRoe', 'dupontRoe'),
      v('roe', 'pct', '#a78bfa', 'roe', 'roe'),
      v('roa', 'pct', '#22d3ee', 'roa', 'roa'),
    ],
    presets: {
      chain: ['dupontMargin', 'dupontTurn', 'dupontLev', 'dupontRoe'],
      compare: ['dupontRoe', 'roe', 'roa'],
    },
    defaultPreset: 'chain',
    deltaKeys: ['dupontRoe', 'roe', 'roa', 'dupontLev'],
    timelineKeys: ['dupontMargin', 'dupontTurn', 'dupontLev', 'dupontRoe'],
  },
  score: {
    kind: 'market',
    backPath: '/dashboard/analyse/score',
    moduleId: 'score',
    vars: [
      v('conanScore', 'ratio', '#d4af37', 'conan', 'conanShort'),
      v('x1', 'ratio', '#38bdf8', 'conanX1', 'x1'),
      v('x2', 'ratio', '#34d399', 'conanX2', 'x2'),
      v('x3', 'ratio', '#a78bfa', 'conanX3', 'x3'),
      v('x4', 'ratio', '#fb923c', 'conanX4', 'x4'),
      v('x5', 'ratio', '#f87171', 'conanX5', 'x5'),
    ],
    presets: {
      score: ['conanScore'],
      factors: ['x1', 'x2', 'x3', 'x4', 'x5'],
      all: ['conanScore', 'x1', 'x2', 'x5'],
    },
    defaultPreset: 'all',
    deltaKeys: ['conanScore', 'x1', 'x2', 'x5'],
    timelineKeys: ['conan', 'conanX1', 'conanX2', 'conanX5'],
  },
  trends: {
    kind: 'market',
    backPath: '/dashboard/analyse/tendances',
    moduleId: 'trends',
    vars: [
      v('roe', 'pct', '#d4af37', 'roe', 'roe'),
      v('roa', 'pct', '#38bdf8', 'roa', 'roa'),
      v('currentRatio', 'ratio', '#34d399', 'currentRatio', 'currentRatio'),
      v('debtRatio', 'ratio', '#f87171', 'debtRatio', 'debtRatio'),
      v('net', 'money', '#a78bfa', null, 'trendNet'),
      v('sales', 'money', '#fb923c', null, 'trendSales'),
    ],
    presets: {
      returns: ['roe', 'roa'],
      risk: ['currentRatio', 'debtRatio'],
      size: ['net', 'sales'],
      all: ['roe', 'roa', 'currentRatio', 'debtRatio'],
    },
    defaultPreset: 'all',
    deltaKeys: ['roe', 'roa', 'currentRatio', 'debtRatio', 'net'],
    timelineKeys: ['roe', 'roa', 'currentRatio', 'debtRatio'],
  },
}

export function resolveDeepScope(scopeId) {
  const id = DEEP_SCOPES[scopeId] ? scopeId : 'structure'
  return { id, ...DEEP_SCOPES[id] }
}

export function buildDeepYearSeries(userId) {
  const years = listYears(userId)
  return years
    .map((year) => {
      const data = loadFinancial(userId, year)
      const structure = computeStructureMetrics(data.bilanRows)
      if (structure.empty) return null
      const f = computeFundamentals({ bilanRows: data.bilanRows, tcrAmounts: data.tcrAmounts })
      return {
        year,
        structure,
        f,
        values: {
          // structure
          frng: structure.frng,
          bfr: structure.bfr,
          tresorerie: structure.tresorerie,
          totalActif: structure.totalActif,
          totalPassif: structure.totalPassif,
          liquidity: structure.liquidity,
          shareCourant: structure.shareCourant,
          shareNonCourant: structure.shareNonCourant,
          shareEquity: structure.shareEquity,
          shareDebt: structure.shareDebt,
          // liquidity
          currentRatio: f.liquidity.currentRatio,
          quickRatio: f.liquidity.quickRatio,
          cashRatio: f.liquidity.cashRatio,
          // solvency
          debtRatio: f.solvency.debtRatio,
          equityRatio: f.solvency.equityRatio,
          gearing: f.solvency.gearing,
          autonomy: f.solvency.financialAutonomy,
          coverage: f.solvency.longTermCoverage,
          tresorerieNette: f.solvency.tresorerieNette,
          // profitability
          netMargin: f.profitability.netMargin,
          operatingMargin: f.profitability.operatingMargin,
          ebeMargin: f.profitability.ebeMargin,
          roa: f.profitability.roa,
          roe: f.profitability.roe,
          // activity
          assetTurnover: f.activity.assetTurnover,
          inventoryTurnover: f.activity.inventoryTurnover,
          receivablesTurnover: f.activity.receivablesTurnover,
          dso: f.activity.dso,
          dio: f.activity.dio,
          // dupont (pct-friendly)
          dupontMargin: f.dupont.netMargin == null ? null : f.dupont.netMargin * 100,
          dupontTurn: f.dupont.assetTurnover,
          dupontLev: f.dupont.equityMultiplier,
          dupontRoe: f.dupont.roe == null ? null : f.dupont.roe * 100,
          // score
          conanScore: f.score.conanScore,
          x1: f.score.x1,
          x2: f.score.x2,
          x3: f.score.x3,
          x4: f.score.x4,
          x5: f.score.x5,
          // trends extras
          net: f.tcr.net,
          sales: f.tcr.production,
        },
      }
    })
    .filter(Boolean)
}

export function resolveVarLabel(varDef, t) {
  const a = t.analysis || {}
  const m = t.modules || {}
  if (varDef.labelFrom === 'analysis') return a[varDef.labelKey] || varDef.id
  return m[varDef.labelKey] || a[varDef.labelKey] || varDef.id
}

export function buildYearReadings(row, scope, lang) {
  if (scope.kind === 'structure') {
    const metrics = row.structure
    return {
      year: row.year,
      overview: buildStructureMetricInfo('overview', metrics, lang).verdict,
      points: [
        buildStructureMetricInfo('liquidity', metrics, lang).verdict,
        buildStructureMetricInfo('frng', metrics, lang).verdict,
        buildStructureMetricInfo('bfr', metrics, lang).verdict,
        buildStructureMetricInfo('treasuryNet', metrics, lang).verdict,
      ],
    }
  }

  const points = []
  for (const key of scope.timelineKeys || []) {
    const varDef = scope.vars.find((x) => x.marketId === key || x.id === key)
    if (!varDef?.marketId) continue
    const value =
      varDef.id === 'dupontMargin' || varDef.id === 'dupontRoe'
        ? row.values[varDef.id]
        : row.values[varDef.id]
    // market readings expect ROE/ROA as percent numbers already in profitability; dupontMargin stored as pct
    let readingValue = value
    if (['roe', 'roa', 'netMargin', 'operatingMargin', 'ebeMargin'].includes(varDef.id)) {
      readingValue = value
    }
    if (varDef.id === 'dupontMargin' || varDef.id === 'dupontRoe') {
      // buildMarketMetricInfo for dupontMargin expects decimal for *100 in verdict — pass /100
      readingValue = value == null ? null : value / 100
    }
    const info = buildMarketMetricInfo(varDef.marketId, readingValue, {
      lang,
      money: varDef.scale === 'money',
      percent: varDef.scale === 'pct' && !String(varDef.id).startsWith('dupont'),
      digits: varDef.id === 'conanScore' ? 3 : 2,
    })
    if (info.verdict) points.push(info.verdict)
  }
  return {
    year: row.year,
    overview: points[0] || '',
    points: points.slice(0, 6),
  }
}
