export const PROFESSION_VALUES = {
  NONE: '',
  STUDENT: 'student',
  PROFESSOR: 'professor',
}

export const ACADEMIC_YEAR_OPTIONS = [
  { value: 'licence1', ar: 'سنة أولى ليسانس', fr: '1ère année Licence' },
  { value: 'licence2', ar: 'سنة ثانية ليسانس', fr: '2ème année Licence' },
  { value: 'licence3', ar: 'سنة ثالثة ليسانس', fr: '3ème année Licence' },
  { value: 'master1', ar: 'سنة أولى ماستر', fr: '1ère année Master' },
  { value: 'master2', ar: 'سنة ثانية ماستر', fr: '2ème année Master' },
  { value: 'doctorate', ar: 'طور دكتوراه', fr: 'Doctorat' },
]

export function academicYearLabel(value, lang = 'ar') {
  const opt = ACADEMIC_YEAR_OPTIONS.find((o) => o.value === value)
  if (!opt) return value || '—'
  return lang === 'fr' ? opt.fr : opt.ar
}

export function professionLabel(value, t) {
  if (value === PROFESSION_VALUES.STUDENT) return t.register.professionStudent
  if (value === PROFESSION_VALUES.PROFESSOR) return t.register.professionProfessor
  return '—'
}
