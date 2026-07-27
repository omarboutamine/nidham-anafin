import { sumBilanBySection } from './analysisEngine'

function pct(part, total) {
  if (!total) return 0
  return (part / total) * 100
}

/** Structure metrics for one bilan year (SCF functional reading). */
export function computeStructureMetrics(bilanRows) {
  const b = sumBilanBySection(bilanRows)
  const empty = b.totalActif === 0 && b.totalPassif === 0
  const tresorerie = b.frng - b.bfr
  return {
    totalActif: b.totalActif,
    totalPassif: b.totalPassif,
    actifCourant: b.actifCourant,
    actifNonCourant: b.actifNonCourant,
    passifCourant: b.passifCourant,
    passifNonCourant: b.passifNonCourant,
    capitaux: b.capitaux,
    shareCourant: pct(b.actifCourant, b.totalActif),
    shareNonCourant: pct(b.actifNonCourant, b.totalActif),
    shareEquity: pct(b.capitaux, b.totalPassif),
    shareDebt: pct(b.passifCourant + b.passifNonCourant, b.totalPassif),
    liquidity: b.passifCourant ? b.actifCourant / b.passifCourant : null,
    frng: b.frng,
    bfr: b.bfr,
    tresorerie,
    empty,
  }
}

/** Series keys available on the deep-reading chart (stable ids). */
export const DEEP_READING_VARS = [
  { id: 'frng', scale: 'money', color: '#d4af37' },
  { id: 'bfr', scale: 'money', color: '#38bdf8' },
  { id: 'tresorerie', scale: 'money', color: '#34d399' },
  { id: 'totalActif', scale: 'money', color: '#a78bfa' },
  { id: 'totalPassif', scale: 'money', color: '#f472b6' },
  { id: 'liquidity', scale: 'ratio', color: '#fb923c' },
  { id: 'shareCourant', scale: 'pct', color: '#22d3ee' },
  { id: 'shareNonCourant', scale: 'pct', color: '#818cf8' },
  { id: 'shareEquity', scale: 'pct', color: '#4ade80' },
  { id: 'shareDebt', scale: 'pct', color: '#f87171' },
]

export const DEEP_READING_PRESETS = {
  balance: ['frng', 'bfr', 'tresorerie'],
  liquidity: ['liquidity', 'shareEquity', 'shareDebt'],
  size: ['totalActif', 'totalPassif'],
  composition: ['shareCourant', 'shareNonCourant', 'shareEquity'],
}
