import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  DEFAULT_LANDING_LANG,
  LANDING_LANG_KEY,
  getLandingContent,
} from '../config/landingI18n'

const LangContext = createContext(null)

function readStoredLang() {
  try {
    const stored = localStorage.getItem(LANDING_LANG_KEY)
    return stored === 'fr' ? 'fr' : DEFAULT_LANDING_LANG
  } catch {
    return DEFAULT_LANDING_LANG
  }
}

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(readStoredLang)

  const setLang = useCallback((next) => {
    const value = next === 'fr' ? 'fr' : DEFAULT_LANDING_LANG
    setLangState(value)
    try {
      localStorage.setItem(LANDING_LANG_KEY, value)
    } catch {
      /* ignore */
    }
  }, [])

  const t = useMemo(() => getLandingContent(lang), [lang])
  const dir = lang === 'ar' ? 'rtl' : 'ltr'

  useEffect(() => {
    document.documentElement.lang = lang === 'ar' ? 'ar' : 'fr'
    document.documentElement.dir = dir
  }, [lang, dir])

  const value = useMemo(() => ({ lang, setLang, t, dir }), [lang, setLang, t, dir])

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useLandingLang() {
  const ctx = useContext(LangContext)
  if (!ctx) {
    throw new Error('useLandingLang must be used within LangProvider')
  }
  return ctx
}
