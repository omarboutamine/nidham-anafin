/**
 * Domaines / motifs d’e-mails universitaires algériens (étudiants & personnel).
 * Sources observées : USTO (@etu.univ-usto.dz), Alger 2 (@etu.univ-alger2.dz),
 * Batna 2 (@etu.univ-batna2.dz), Tlemcen (@univ-tlemcen.dz), SBA (@univ-sba.dz),
 * plus le schéma national courant @etu.univ-*.dz / @univ-*.dz / *.edu.dz
 */

/** Domaines explicitement connus (liste évolutive). */
export const KNOWN_ALGERIAN_UNI_DOMAINS = [
  // Étudiants (sous-domaine etu.)
  'etu.univ-usto.dz',
  'etu.univ-alger.dz',
  'etu.univ-alger2.dz',
  'etu.univ-alger3.dz',
  'etu.univ-batna.dz',
  'etu.univ-batna2.dz',
  'etu.univ-blida.dz',
  'etu.univ-blida2.dz',
  'etu.univ-bejaia.dz',
  'etu.univ-annaba.dz',
  'etu.univ-setif.dz',
  'etu.univ-setif2.dz',
  'etu.univ-constantine1.dz',
  'etu.univ-constantine2.dz',
  'etu.univ-constantine3.dz',
  'etu.univ-oran1.dz',
  'etu.univ-oran2.dz',
  'etu.univ-mosta.dz',
  'etu.univ-sba.dz',
  'etu.univ-tlemcen.dz',
  'etu.univ-ouargla.dz',
  'etu.univ-biskra.dz',
  'etu.univ-msila.dz',
  'etu.univ-bouira.dz',
  'etu.univ-jijel.dz',
  'etu.univ-guelma.dz',
  'etu.univ-skikda.dz',
  'etu.univ-adrar.dz',
  'etu.univ-eloued.dz',
  'etu.univ-khenchela.dz',
  'etu.univ-tebessa.dz',
  'etu.univ-tiaret.dz',
  'etu.univ-saida.dz',
  'etu.univ-relizane.dz',
  'etu.univ-chlef.dz',
  'etu.univ-medea.dz',
  'etu.univ-djelfa.dz',
  'etu.univ-laghouat.dz',
  'etu.univ-boumerdes.dz',
  'etu.univ-tipaza.dz',
  // Personnel / messagerie établissement
  'univ-usto.dz',
  'univ-alger.dz',
  'univ-alger2.dz',
  'univ-alger3.dz',
  'univ-batna.dz',
  'univ-batna2.dz',
  'univ-blida.dz',
  'univ-blida2.dz',
  'univ-bejaia.dz',
  'univ-annaba.dz',
  'univ-setif.dz',
  'univ-setif2.dz',
  'univ-constantine1.dz',
  'univ-constantine2.dz',
  'univ-constantine3.dz',
  'univ-oran1.dz',
  'univ-oran2.dz',
  'univ-mosta.dz',
  'univ-sba.dz',
  'univ-tlemcen.dz',
  'univ-ouargla.dz',
  'univ-biskra.dz',
  'univ-msila.dz',
  'univ-bouira.dz',
  'univ-jijel.dz',
  'univ-guelma.dz',
  'univ-skikda.dz',
  'univ-adrar.dz',
  'univ-eloued.dz',
  'univ-khenchela.dz',
  'univ-tebessa.dz',
  'univ-tiaret.dz',
  'univ-saida.dz',
  'univ-relizane.dz',
  'univ-chlef.dz',
  'univ-medea.dz',
  'univ-djelfa.dz',
  'univ-laghouat.dz',
  'univ-boumerdes.dz',
  'univ-tipaza.dz',
  'ummto.dz',
  'fs.ummto.dz',
  // Grandes écoles / établissements
  'usthb.dz',
  'esi.dz',
  'enp.edu.dz',
  'ens-kouba.dz',
  'ensh.dz',
  'esc-alger.dz',
]

/**
 * Motifs génériques couvrant la majorité des établissements algériens
 * même s’ils ne sont pas encore dans la liste connue.
 */
const GENERIC_PATTERNS = [
  /@etu\.univ-[a-z0-9-]+\.dz$/i,
  /@univ-[a-z0-9-]+\.dz$/i,
  /@etu-univ-[a-z0-9-]+\.dz$/i,
  /@[a-z0-9-]+\.edu\.dz$/i,
  /@(usthb|esi|enp|ensh|ensa|ensb|esc-alger|enssia)\.dz$/i,
  /@mail\.univ-[a-z0-9-]+\.dz$/i,
  /@etu\.usthb\.dz$/i,
  /@[a-z0-9-]+\.ummto\.dz$/i,
  /@ummto\.dz$/i,
  /@[a-z0-9-]+\.univ-[a-z0-9-]+\.dz$/i,
]

function extractDomain(email) {
  const at = String(email || '').trim().toLowerCase().lastIndexOf('@')
  if (at < 0) return ''
  return String(email).trim().toLowerCase().slice(at + 1)
}

export function isAlgerianUniversityEmail(email) {
  const value = String(email || '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return false
  if (!value.endsWith('.dz')) return false

  const domain = extractDomain(value)
  if (KNOWN_ALGERIAN_UNI_DOMAINS.includes(domain)) return true

  return GENERIC_PATTERNS.some((re) => re.test(value))
}

export function universityEmailHintExamples() {
  return [
    'prenom.nom@etu.univ-batna2.dz',
    'matricule@etu.univ-usto.dz',
    'prenom.nom@univ-tlemcen.dz',
  ]
}
