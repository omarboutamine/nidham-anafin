/** SCF-style templates for manual pedagogical entry (not ledger-driven). */

export const BILAN_SECTIONS = {
  actifNonCourant: {
    side: 'actif',
    order: 1,
    key: 'actifNonCourant',
    fr: 'Actif non courant',
    ar: 'أصول غير جارية',
  },
  actifCourant: {
    side: 'actif',
    order: 2,
    key: 'actifCourant',
    fr: 'Actif courant',
    ar: 'أصول جارية',
  },
  capitauxPropres: {
    side: 'passif',
    order: 1,
    key: 'capitauxPropres',
    fr: 'Capitaux propres',
    ar: 'رؤوس الأموال الخاصة',
  },
  passifNonCourant: {
    side: 'passif',
    order: 2,
    key: 'passifNonCourant',
    fr: 'Passif non courant',
    ar: 'خصوم غير جارية',
  },
  passifCourant: {
    side: 'passif',
    order: 3,
    key: 'passifCourant',
    fr: 'Passif courant',
    ar: 'خصوم جارية',
  },
}

export const DEFAULT_BILAN_ROWS = [
  { id: 'a20', section: 'actifNonCourant', number: '20', labelFr: 'Immobilisations incorporelles', labelAr: 'تثبيتات معنوية', amount: '' },
  { id: 'a21', section: 'actifNonCourant', number: '21', labelFr: 'Immobilisations corporelles', labelAr: 'تثبيتات عينية', amount: '' },
  { id: 'a27', section: 'actifNonCourant', number: '27', labelFr: 'Autres immobilisations financières', labelAr: 'تثبيتات مالية أخرى', amount: '' },
  { id: 'a30', section: 'actifCourant', number: '30', labelFr: 'Stocks et en-cours', labelAr: 'مخزونات ومنتجات قيد التنفيذ', amount: '' },
  { id: 'a41', section: 'actifCourant', number: '41', labelFr: 'Clients', labelAr: 'الزبائن', amount: '' },
  { id: 'a512', section: 'actifCourant', number: '512', labelFr: 'Banques', labelAr: 'البنوك', amount: '' },
  { id: 'a53', section: 'actifCourant', number: '53', labelFr: 'Caisse', labelAr: 'الصندوق', amount: '' },
  { id: 'p101', section: 'capitauxPropres', number: '101', labelFr: 'Capital émis', labelAr: 'رأس المال الصادر', amount: '' },
  { id: 'p106', section: 'capitauxPropres', number: '106', labelFr: 'Réserves', labelAr: 'الاحتياطات', amount: '' },
  { id: 'p12', section: 'capitauxPropres', number: '12', labelFr: 'Résultat net de l’exercice', labelAr: 'النتيجة الصافية للسنة', amount: '' },
  { id: 'p16', section: 'passifNonCourant', number: '16', labelFr: 'Emprunts et dettes assimilées', labelAr: 'اقتراضات وديون مماثلة', amount: '' },
  { id: 'p401', section: 'passifCourant', number: '401', labelFr: 'Fournisseurs', labelAr: 'الموردون', amount: '' },
  { id: 'p42', section: 'passifCourant', number: '42', labelFr: 'Personnel', labelAr: 'المستخدمون', amount: '' },
  { id: 'p44', section: 'passifCourant', number: '44', labelFr: 'État — impôts et taxes', labelAr: 'الدولة — الضرائب والرسوم', amount: '' },
  {
    id: 'p519',
    section: 'passifCourant',
    number: '519',
    labelFr: 'Concours bancaires courants',
    labelAr: 'تسبيقات وقروض بنكية جارية',
    amount: '',
  },
]

/** TCR leaf inputs (editable). Computed SCF lines derive from these. */
export const TCR_INPUTS = [
  { id: 'p70', group: 'production', labelFr: 'Ventes et produits assimilés (70)', labelAr: 'المبيعات والمنتوجات المماثلة (70)' },
  { id: 'p72', group: 'production', labelFr: 'Production stockée / déstockage (72)', labelAr: 'الإنتاج المخزّن / تخفيض المخزون (72)' },
  { id: 'p73', group: 'production', labelFr: 'Production immobilisée (73)', labelAr: 'الإنتاج المثبت (73)' },
  { id: 'p74', group: 'production', labelFr: 'Subventions d’exploitation (74)', labelAr: 'إعانات الاستغلال (74)' },
  { id: 'c60', group: 'consommation', labelFr: 'Achats consommés (60)', labelAr: 'المشتريات المستهلكة (60)' },
  { id: 'c61', group: 'consommation', labelFr: 'Services extérieurs (61+62)', labelAr: 'الخدمات الخارجية (61+62)' },
  { id: 'c63', group: 'ebe', labelFr: 'Charges de personnel (63)', labelAr: 'أعباء المستخدمين (63)' },
  { id: 'c64', group: 'ebe', labelFr: 'Impôts, taxes et versements assimilés (64)', labelAr: 'الضرائب والرسوم والمدفوعات المماثلة (64)' },
  { id: 'p75', group: 'exploitation', labelFr: 'Autres produits opérationnels (75)', labelAr: 'منتوجات عملياتية أخرى (75)' },
  { id: 'c65', group: 'exploitation', labelFr: 'Autres charges opérationnelles (65)', labelAr: 'أعباء عملياتية أخرى (65)' },
  { id: 'c68', group: 'exploitation', labelFr: 'Dotations aux amortissements et provisions (68)', labelAr: 'مخصصات الاهتلاكات والمؤونات (68)' },
  { id: 'p78', group: 'exploitation', labelFr: 'Reprises sur amortissements et provisions (78)', labelAr: 'استرجاعات عن اهتلاكات ومؤونات (78)' },
  { id: 'p76', group: 'financier', labelFr: 'Produits financiers (76)', labelAr: 'المنتوجات المالية (76)' },
  { id: 'c66', group: 'financier', labelFr: 'Charges financières (66)', labelAr: 'الأعباء المالية (66)' },
  { id: 'c69', group: 'impots', labelFr: 'Impôts sur les bénéfices (695+698)', labelAr: 'ضرائب على النتائج (695+698)' },
  { id: 'p77', group: 'extra', labelFr: 'Produits extraordinaires (77)', labelAr: 'منتوجات استثنائية (77)' },
  { id: 'c67', group: 'extra', labelFr: 'Charges extraordinaires (67)', labelAr: 'أعباء استثنائية (67)' },
]

export function emptyTcrAmounts() {
  const amounts = {}
  for (const row of TCR_INPUTS) amounts[row.id] = ''
  return amounts
}

export function n(v) {
  const x = Number(String(v).replace(/\s/g, '').replace(',', '.'))
  return Number.isFinite(x) ? x : 0
}

export function computeTcr(amounts) {
  const a = (id) => n(amounts[id])
  const production = a('p70') + a('p72') + a('p73') + a('p74')
  const consommation = a('c60') + a('c61')
  const va = production - consommation
  const ebe = va - a('c63') - a('c64')
  const exploitation = ebe + a('p75') - a('c65') - a('c68') + a('p78')
  const financier = a('p76') - a('c66')
  const ordinaire = exploitation + financier
  const netOrdinaire = ordinaire - a('c69')
  const extra = a('p77') - a('c67')
  const net = netOrdinaire + extra
  return {
    production,
    consommation,
    va,
    ebe,
    exploitation,
    financier,
    ordinaire,
    netOrdinaire,
    extra,
    net,
  }
}

export function formatMoney(value, lang = 'fr') {
  const num = n(value)
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-DZ' : 'fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}
