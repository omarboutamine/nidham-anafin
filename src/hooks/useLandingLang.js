import { useEffect, useMemo, useState } from 'react'
import {
  DEFAULT_LANDING_LANG,
  LANDING_LANG_KEY,
  getLandingContent,
} from '../config/landingI18n'

function readStoredLang() {
  try {
    const stored = localStorage.getItem(LANDING_LANG_KEY)
    return stored === 'fr' ? 'fr' : DEFAULT_LANDING_LANG
  } catch {
    return DEFAULT_LANDING_LANG
  }
}

export function useLandingLang() {
  const [lang, setLangState] = useState(readStoredLang)

  const setLang = (next) => {
    const value = next === 'fr' ? 'fr' : DEFAULT_LANDING_LANG
    setLangState(value)
    try {
      localStorage.setItem(LANDING_LANG_KEY, value)
    } catch {
      /* ignore */
    }
  }

  const t = useMemo(() => getLandingContent(lang), [lang])
  const dir = lang === 'ar' ? 'rtl' : 'ltr'

  useEffect(() => {
    document.documentElement.lang = lang === 'ar' ? 'ar' : 'fr'
    document.documentElement.dir = dir
    return () => {
      document.documentElement.lang = 'ar'
      document.documentElement.dir = 'rtl'
    }
  }, [lang, dir])

  return { lang, setLang, t, dir }
}
