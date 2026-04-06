'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { translations, Lang, Translations } from '../lib/i18n'

interface LanguageContextType {
  lang: Lang
  setLang: (l: Lang) => void
  t: Translations
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'pt',
  setLang: () => {},
  t: translations.pt,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('pt')

  useEffect(() => {
    const saved = localStorage.getItem('lang') as Lang | null
    if (saved === 'pt' || saved === 'en') setLangState(saved)
  }, [])

  function setLang(l: Lang) {
    setLangState(l)
    localStorage.setItem('lang', l)
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] as Translations }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLang() {
  return useContext(LanguageContext)
}
