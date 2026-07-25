/** Plan comptable SCF (extrait pédagogique — classes 1 à 7) */
export const SCF_CLASS_TABS = [
  { digit: '1', ar: 'الصنف 1 — رؤوس الأموال', fr: 'Classe 1 — Capitaux' },
  { digit: '2', ar: 'الصنف 2 — التثبيتات', fr: 'Classe 2 — Immobilisations' },
  { digit: '3', ar: 'الصنف 3 — المخزونات', fr: 'Classe 3 — Stocks' },
  { digit: '4', ar: 'الصنف 4 — الغير', fr: 'Classe 4 — Tiers' },
  { digit: '5', ar: 'الصنف 5 — المالية', fr: 'Classe 5 — Financiers' },
  { digit: '6', ar: 'الصنف 6 — الأعباء', fr: 'Classe 6 — Charges' },
  { digit: '7', ar: 'الصنف 7 — النواتج', fr: 'Classe 7 — Produits' },
]

/** Classification bilan (classes 1–5 only) */
export const BILAN_CLASSIFICATIONS = [
  { value: 'current_assets', ar: 'أصول جارية', fr: 'Actifs courants' },
  { value: 'non_current_assets', ar: 'أصول غير جارية', fr: 'Actifs non courants' },
  { value: 'equity', ar: 'حقوق الملكية', fr: 'Capitaux propres' },
  { value: 'lt_liabilities', ar: 'ديون والتزامات طويلة الأجل', fr: 'Passifs non courants' },
  { value: 'st_liabilities', ar: 'ديون والتزامات قصيرة الأجل', fr: 'Passifs courants' },
]

export function defaultClassificationForAccount(accountNumber) {
  const digit = String(accountNumber).charAt(0)
  if (digit === '1') return 'equity'
  if (digit === '2') return 'non_current_assets'
  if (digit === '3' || digit === '5') return 'current_assets'
  if (digit === '4') {
    const n = String(accountNumber)
    if (n.startsWith('41') || n.startsWith('42') || n.startsWith('43') || n.startsWith('46')) {
      return 'current_assets'
    }
    return 'st_liabilities'
  }
  return ''
}

export function accountClassDigit(accountNumber) {
  return String(accountNumber).charAt(0)
}

export function isBilanClass(accountNumber) {
  const d = accountClassDigit(accountNumber)
  return d >= '1' && d <= '5'
}

export function isTcrClass(accountNumber) {
  const d = accountClassDigit(accountNumber)
  return d === '6' || d === '7'
}

export const SCF_ACCOUNTS = [
  { number: '1', name: 'Comptes de capitaux' },
  { number: '10', name: 'Capital, réserves et assimilés' },
  { number: '101', name: 'Capital émis' },
  { number: '106', name: 'Réserves' },
  { number: '11', name: 'Report à nouveau' },
  { number: '12', name: "Résultat de l'exercice" },
  { number: '13', name: "Produits et charges différés — hors cycle d'exploitation" },
  { number: '15', name: 'Provisions pour charges — passifs non courants' },
  { number: '16', name: 'Emprunts et dettes assimilées' },
  { number: '17', name: 'Dettes rattachées à des participations' },

  { number: '2', name: "Comptes d'immobilisations" },
  { number: '20', name: 'Immobilisations incorporelles' },
  { number: '203', name: 'Frais de développement immobilisables' },
  { number: '204', name: 'Logiciels informatiques et assimilés' },
  { number: '205', name: 'Concessions, brevets, licences, marques' },
  { number: '21', name: 'Immobilisations corporelles' },
  { number: '211', name: 'Terrains' },
  { number: '213', name: 'Constructions' },
  { number: '215', name: 'Installations techniques, matériel et outillage' },
  { number: '218', name: 'Autres immobilisations corporelles' },
  { number: '22', name: 'Immobilisations en concession' },
  { number: '23', name: 'Immobilisations en cours' },
  { number: '26', name: 'Participations et créances rattachées' },
  { number: '27', name: 'Autres immobilisations financières' },
  { number: '28', name: 'Amortissements des immobilisations' },
  { number: '29', name: 'Pertes de valeur sur immobilisations' },

  { number: '3', name: 'Comptes de stocks et en-cours' },
  { number: '30', name: 'Stocks de marchandises' },
  { number: '31', name: 'Matières premières et fournitures' },
  { number: '32', name: 'Autres approvisionnements' },
  { number: '33', name: 'En-cours de production de biens' },
  { number: '34', name: 'En-cours de production de services' },
  { number: '35', name: 'Stocks de produits' },
  { number: '37', name: "Stocks à l'extérieur" },
  { number: '38', name: 'Achats stockés' },
  { number: '39', name: 'Pertes de valeur sur stocks et en-cours' },

  { number: '4', name: 'Comptes de tiers' },
  { number: '40', name: 'Fournisseurs et comptes rattachés' },
  { number: '401', name: 'Fournisseurs de biens et services' },
  { number: '41', name: 'Clients et comptes rattachés' },
  { number: '411', name: 'Clients' },
  { number: '42', name: 'Personnel et comptes rattachés' },
  { number: '43', name: 'Organismes sociaux et comptes rattachés' },
  { number: '44', name: 'État, collectivités publiques' },
  { number: '45', name: 'Groupe et associés' },
  { number: '46', name: 'Débiteurs et créditeurs divers' },
  { number: '47', name: "Comptes transitoires ou d'attente" },
  { number: '48', name: 'Charges ou produits constatés d’avance et provisions courantes' },
  { number: '49', name: 'Pertes de valeur sur comptes de tiers' },

  { number: '5', name: 'Comptes financiers' },
  { number: '50', name: 'Valeurs mobilières de placement' },
  { number: '51', name: 'Banques, établissements financiers et assimilés' },
  { number: '512', name: 'Banques comptes courants' },
  { number: '53', name: 'Caisse' },
  { number: '54', name: "Régies d'avances et accréditifs" },
  { number: '58', name: 'Virements internes' },
  { number: '59', name: 'Pertes de valeur sur actifs financiers courants' },

  { number: '6', name: 'Comptes de charges' },
  { number: '60', name: 'Achats consommés' },
  { number: '601', name: 'Matières premières' },
  { number: '602', name: 'Autres approvisionnements' },
  { number: '61', name: 'Services extérieurs' },
  { number: '62', name: 'Autres services extérieurs' },
  { number: '63', name: 'Charges de personnel' },
  { number: '64', name: 'Impôts, taxes et versements assimilés' },
  { number: '65', name: 'Autres charges opérationnelles' },
  { number: '66', name: 'Charges financières' },
  { number: '68', name: 'Dotations aux amortissements, provisions et pertes de valeur' },
  { number: '69', name: 'Impôts sur les résultats et assimilés' },

  { number: '7', name: 'Comptes de produits' },
  { number: '70', name: 'Ventes de marchandises, produits fabriqués et prestations' },
  { number: '701', name: 'Ventes de produits finis' },
  { number: '702', name: 'Ventes de produits intermédiaires' },
  { number: '703', name: 'Ventes de produits résiduels' },
  { number: '704', name: 'Ventes de travaux' },
  { number: '705', name: 'Ventes d’études' },
  { number: '706', name: 'Autres prestations de services' },
  { number: '707', name: 'Ventes de marchandises' },
  { number: '72', name: 'Production stockée ou déstockée' },
  { number: '73', name: 'Production immobilisée' },
  { number: '74', name: "Subventions d'exploitation" },
  { number: '75', name: 'Autres produits opérationnels' },
  { number: '76', name: 'Produits financiers' },
  { number: '78', name: 'Reprises sur pertes de valeur et provisions' },
]

export function accountsByClass(digit) {
  return SCF_ACCOUNTS.filter((a) => String(a.number).startsWith(String(digit)))
}

export function findAccount(number) {
  return SCF_ACCOUNTS.find((a) => a.number === String(number)) || null
}
