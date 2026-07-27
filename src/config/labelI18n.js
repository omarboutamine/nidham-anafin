import { DEFAULT_BILAN_ROWS, TCR_INPUTS } from './financialTemplates'

const PLACEHOLDERS = new Set(['بند جديد', 'Nouveau poste', 'New line', 'New item'])

/** Extra SCF / bilan labels often typed from Excel (FR ↔ AR). */
const EXTRA_PAIRS = [
  ['Immobilisations incorporelles', 'تثبيتات معنوية'],
  ['Immobilisations corporelles', 'تثبيتات عينية'],
  ['Terrain', 'أراضي'],
  ['Terrains', 'أراضي'],
  ['Bâtiment', 'مباني'],
  ['Bâtiments', 'مباني'],
  ['Autres immobilisations corporelles', 'تثبيتات عينية أخرى'],
  ['Immobilisations en concession', 'تثبيتات في شكل امتياز'],
  ['Immobilisation en cours', 'تثبيتات جارية'],
  ['Immobilisations en cours', 'تثبيتات جارية'],
  ['Immobilisations financières', 'تثبيتات مالية'],
  ['Titres mis en équivalence', 'سندات موضوعة موضع معادلة'],
  ['Autres participations et créances rattachées', 'مساهمات أخرى وديون مرتبطة'],
  ['Autres participations & créances rattachées', 'مساهمات أخرى وديون مرتبطة'],
  ['Autres titres immobilisés', 'سندات مثبتة أخرى'],
  ['Prêts et autres titres financiers non courants', 'قروض وسندات مالية أخرى غير جارية'],
  ['Impôts différés actif', 'ضرائب مؤجلة أصول'],
  ['Stocks et encours', 'مخزونات ومنتجات قيد التنفيذ'],
  ['Stocks et en-cours', 'مخزونات ومنتجات قيد التنفيذ'],
  ['Créances et emplois assimilés', 'حسابات مدينة واستخدامات مماثلة'],
  ['Clients', 'الزبائن'],
  ['Autres débiteurs', 'مدينون آخرون'],
  ['Impôts et assimilés', 'ضرائب وما شابهها'],
  ['Autres créances et emplois assimilés', 'حسابات مدينة واستخدامات مماثلة أخرى'],
  ['Disponibilités et assimilés', 'خزينة وما شابهها'],
  ['Placements et autres actifs financiers courants', 'توظيفات وأصول مالية جارية أخرى'],
  ['Trésorerie', 'خزينة'],
  ['Capital émis', 'رأس المال الصادر'],
  ['Capital non appelé', 'رأس المال غير المطلوب'],
  ['Écart de réévaluation', 'فارق إعادة التقييم'],
  ['Ecart de réévaluation', 'فارق إعادة التقييم'],
  ['Primes et réserves', 'علاوات واحتياطات'],
  ['Primes et réserves - Réserves consolidées', 'علاوات واحتياطات — احتياطات مجمّعة'],
  ['Résultat net', 'النتيجة الصافية'],
  ['Résultat net - RN', 'النتيجة الصافية'],
  ['Résultat net de l’exercice', 'النتيجة الصافية للسنة'],
  ['Autres capitaux propres - report à nouveau', 'رؤوس أموال خاصة أخرى — ترحيل من جديد'],
  ['Autres capitaux propres', 'رؤوس أموال خاصة أخرى'],
  ['Part de la société consolidante', 'حصة الشركة المجمّعة'],
  ['Emprunts et dettes financières', 'اقتراضات وديون مالية'],
  ['Emprunts et dettes assimilées', 'اقتراضات وديون مماثلة'],
  ['Impôt différé passif', 'ضرائب مؤجلة خصوم'],
  ['Autres dettes non courantes', 'ديون أخرى غير جارية'],
  ['Provisions et produits constatés d’avance', 'مؤونات ومنتوجات مسجّلة مسبقاً'],
  ['Fournisseurs et comptes rattachés', 'موردون وحسابات مرتبطة'],
  ['Fournisseurs', 'الموردون'],
  ['Impôts', 'ضرائب'],
  ['Autres dettes', 'ديون أخرى'],
  ['Trésorerie passif', 'خزينة خصوم'],
]

function stripDiacritics(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function normalizeLabelKey(value) {
  return stripDiacritics(value)
    .toLowerCase()
    .replace(/[’'`]/g, "'")
    .replace(/&/g, ' et ')
    .replace(/[^a-z0-9\u0600-\u06ff]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function buildDictionaries() {
  const frToAr = new Map()
  const arToFr = new Map()

  const add = (fr, ar) => {
    const f = String(fr || '').trim()
    const a = String(ar || '').trim()
    if (!f || !a) return
    frToAr.set(normalizeLabelKey(f), a)
    arToFr.set(normalizeLabelKey(a), f)
    // Also index without trailing account codes like (70)
    const fBare = f.replace(/\s*\([^)]*\)\s*$/, '').trim()
    const aBare = a.replace(/\s*\([^)]*\)\s*$/, '').trim()
    if (fBare && aBare) {
      frToAr.set(normalizeLabelKey(fBare), aBare)
      arToFr.set(normalizeLabelKey(aBare), fBare)
    }
  }

  for (const row of DEFAULT_BILAN_ROWS) add(row.labelFr, row.labelAr)
  for (const row of TCR_INPUTS) add(row.labelFr, row.labelAr)
  for (const [fr, ar] of EXTRA_PAIRS) add(fr, ar)

  return { frToAr, arToFr }
}

const { frToAr, arToFr } = buildDictionaries()

export function isPlaceholderLabel(value, newLineText = '') {
  const v = String(value ?? '').trim()
  if (!v) return true
  if (PLACEHOLDERS.has(v)) return true
  if (newLineText && v === String(newLineText).trim()) return true
  return false
}

/** Translate a known SCF / bilan label; returns null if unknown. */
export function translateBilanLabel(text, toLang) {
  const key = normalizeLabelKey(text)
  if (!key) return null
  const map = toLang === 'ar' ? frToAr : arToFr
  if (map.has(key)) return map.get(key)

  // Fuzzy match truncated labels (e.g. "Immobilisations Incorpo")
  let best = null
  let bestLen = 0
  for (const [dictKey, value] of map.entries()) {
    if (!dictKey || dictKey.length < 6) continue
    if (dictKey.startsWith(key) || key.startsWith(dictKey)) {
      const score = Math.min(dictKey.length, key.length)
      if (score > bestLen) {
        best = value
        bestLen = score
      }
    }
  }
  return bestLen >= 8 ? best : null
}

export function resolveRowLabel(row, lang, newLineText = '') {
  const primary = lang === 'ar' ? row.labelAr : row.labelFr
  const secondary = lang === 'ar' ? row.labelFr : row.labelAr

  if (!isPlaceholderLabel(primary, newLineText)) return primary

  if (!isPlaceholderLabel(secondary, newLineText)) {
    const translated = translateBilanLabel(secondary, lang)
    return translated || secondary
  }

  return primary || secondary || newLineText || ''
}

/**
 * When the user edits a label in the active language, keep the other language
 * in sync: dictionary translation if known, otherwise copy the typed text when
 * the other side is still empty/placeholder.
 */
export function buildLabelPatch(row, lang, value, newLineText = '') {
  const next = String(value ?? '')
  const patch = lang === 'ar' ? { labelAr: next } : { labelFr: next }

  const otherLang = lang === 'ar' ? 'fr' : 'ar'
  const otherValue = lang === 'ar' ? row.labelFr : row.labelAr
  const otherIsEmpty = isPlaceholderLabel(otherValue, newLineText)

  if (otherIsEmpty) {
    const translated = translateBilanLabel(next, otherLang)
    if (lang === 'ar') patch.labelFr = translated || next
    else patch.labelAr = translated || next
  }

  return patch
}

/** Fill missing bilingual labels on loaded rows (display + persistence ready). */
export function healBilanRowLabels(rows, newLineText = '') {
  return (rows || []).map((row) => {
    const arEmpty = isPlaceholderLabel(row.labelAr, newLineText)
    const frEmpty = isPlaceholderLabel(row.labelFr, newLineText)
    if (!arEmpty && !frEmpty) return row

    let labelAr = row.labelAr
    let labelFr = row.labelFr

    if (arEmpty && !frEmpty) {
      labelAr = translateBilanLabel(row.labelFr, 'ar') || row.labelFr
    }
    if (frEmpty && !arEmpty) {
      labelFr = translateBilanLabel(row.labelAr, 'fr') || row.labelAr
    }

    if (labelAr === row.labelAr && labelFr === row.labelFr) return row
    return { ...row, labelAr, labelFr }
  })
}
