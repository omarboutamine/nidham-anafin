import { BILAN_SECTIONS, computeTcr, n } from '../config/financialTemplates'

export function sumBilanBySection(bilanRows) {
  const bySection = {}
  for (const key of Object.keys(BILAN_SECTIONS)) bySection[key] = 0
  for (const row of bilanRows || []) {
    bySection[row.section] = (bySection[row.section] || 0) + n(row.amount)
  }
  const actifCourant = bySection.actifCourant
  const actifNonCourant = bySection.actifNonCourant
  const totalActif = actifCourant + actifNonCourant
  const passifCourant = bySection.passifCourant
  const passifNonCourant = bySection.passifNonCourant
  const capitaux = bySection.capitauxPropres
  const totalPassif = passifCourant + passifNonCourant + capitaux
  const stocks = (bilanRows || [])
    .filter((r) => String(r.number).startsWith('3'))
    .reduce((s, r) => s + n(r.amount), 0)
  const clients = (bilanRows || [])
    .filter((r) => String(r.number).startsWith('41'))
    .reduce((s, r) => s + n(r.amount), 0)
  const tresorerieActif = (bilanRows || [])
    .filter((r) => {
      const num = String(r.number)
      return num.startsWith('5')
    })
    .reduce((s, r) => s + n(r.amount), 0)

  return {
    bySection,
    actifCourant,
    actifNonCourant,
    totalActif,
    passifCourant,
    passifNonCourant,
    capitaux,
    totalPassif,
    stocks,
    clients,
    tresorerieActif,
    frng: capitaux + passifNonCourant - actifNonCourant,
    bfr: actifCourant - passifCourant,
  }
}

function safeDiv(a, b) {
  if (!b) return null
  return a / b
}

function pct(a, b) {
  const r = safeDiv(a, b)
  return r == null ? null : r * 100
}

/** Full fundamental toolkit from bilan + TCR (market / CFA-style). */
export function computeFundamentals(yearData) {
  const b = sumBilanBySection(yearData?.bilanRows)
  const t = computeTcr(yearData?.tcrAmounts || {})
  const sales = t.production
  const net = t.net
  const ebe = t.ebe
  const exploitation = t.exploitation

  const currentRatio = safeDiv(b.actifCourant, b.passifCourant)
  const quickRatio = safeDiv(b.actifCourant - b.stocks, b.passifCourant)
  const cashRatio = safeDiv(b.tresorerieActif, b.passifCourant)

  const debtRatio = safeDiv(b.passifCourant + b.passifNonCourant, b.totalActif)
  const equityRatio = safeDiv(b.capitaux, b.totalPassif)
  const gearing = safeDiv(b.passifCourant + b.passifNonCourant, b.capitaux)
  const financialAutonomy = safeDiv(b.capitaux, b.totalActif)
  const longTermCoverage = safeDiv(b.capitaux + b.passifNonCourant, b.actifNonCourant)

  const netMargin = pct(net, sales)
  const operatingMargin = pct(exploitation, sales)
  const ebeMargin = pct(ebe, sales)
  const roa = pct(net, b.totalActif)
  const roe = pct(net, b.capitaux)
  const ros = netMargin

  const assetTurnover = safeDiv(sales, b.totalActif)
  const inventoryTurnover = safeDiv(n(yearData?.tcrAmounts?.c60), b.stocks)
  const receivablesTurnover = safeDiv(sales, b.clients)
  const dso = safeDiv(b.clients * 365, sales)
  const dio = safeDiv(b.stocks * 365, n(yearData?.tcrAmounts?.c60) || sales)

  const netMarginDec = safeDiv(net, sales)
  const equityMultiplier = safeDiv(b.totalActif, b.capitaux)
  const dupontRoe =
    netMarginDec != null && assetTurnover != null && equityMultiplier != null
      ? netMarginDec * assetTurnover * equityMultiplier
      : null

  // Conan-Holder (classic French scoring) — pedagogical adaptation
  const x1 = safeDiv(ebe, b.totalActif) // gross operating surplus / assets approx
  const x2 = safeDiv(b.capitaux, b.totalPassif)
  const x3 = safeDiv(b.actifCourant - b.stocks, b.totalActif)
  const x4 = safeDiv(b.tresorerieActif, b.totalActif)
  const x5 = safeDiv(b.passifCourant + b.passifNonCourant, b.totalPassif)
  let conanScore = null
  if ([x1, x2, x3, x4, x5].every((x) => x != null)) {
    conanScore = 0.16 * x1 + 0.22 * x2 + 0.87 * x3 + 0.1 * x4 - 0.11 * x5
  }

  const tresorerieNette = b.frng - b.bfr

  return {
    bilan: b,
    tcr: t,
    liquidity: {
      currentRatio,
      quickRatio,
      cashRatio,
    },
    solvency: {
      debtRatio,
      equityRatio,
      gearing,
      financialAutonomy,
      longTermCoverage,
      frng: b.frng,
      bfr: b.bfr,
      tresorerieNette,
    },
    profitability: {
      netMargin,
      operatingMargin,
      ebeMargin,
      roa,
      roe,
      ros,
    },
    activity: {
      assetTurnover,
      inventoryTurnover,
      receivablesTurnover,
      dso,
      dio,
    },
    dupont: {
      netMargin: netMarginDec,
      assetTurnover,
      equityMultiplier,
      roe: dupontRoe,
      roeDirect: roe,
    },
    score: {
      conanScore,
      x1,
      x2,
      x3,
      x4,
      x5,
    },
    empty: b.totalActif === 0 && b.totalPassif === 0 && sales === 0,
  }
}

export function interpretConan(score) {
  if (score == null) return 'unknown'
  if (score > 0.16) return 'safe'
  if (score >= 0.04) return 'watch'
  return 'risk'
}

export function formatRatio(value, { percent = false, digits = 2, lang = 'fr' } = {}) {
  if (value == null || Number.isNaN(value)) return '—'
  if (percent) {
    return `${new Intl.NumberFormat(lang === 'ar' ? 'ar-DZ' : 'fr-FR', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value)} %`
  }
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-DZ' : 'fr-FR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

export const ANALYSIS_MODULES = [
  {
    id: 'structure',
    path: '/dashboard/analyse-structure',
    icon: 'chart',
  },
  {
    id: 'cockpit',
    path: '/dashboard/analyse/cockpit',
    icon: 'pulse',
  },
  {
    id: 'liquidity',
    path: '/dashboard/analyse/liquidite',
    icon: 'drop',
  },
  {
    id: 'solvency',
    path: '/dashboard/analyse/solvabilite',
    icon: 'shield',
  },
  {
    id: 'profitability',
    path: '/dashboard/analyse/rentabilite',
    icon: 'trend',
  },
  {
    id: 'activity',
    path: '/dashboard/analyse/activite',
    icon: 'cycle',
  },
  {
    id: 'dupont',
    path: '/dashboard/analyse/dupont',
    icon: 'layers',
  },
  {
    id: 'score',
    path: '/dashboard/analyse/score',
    icon: 'score',
  },
  {
    id: 'trends',
    path: '/dashboard/analyse/tendances',
    icon: 'timeline',
  },
]
