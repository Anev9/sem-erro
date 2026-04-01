'use client'

import { useLang } from '../contexts/LanguageContext'

export function LanguageToggle() {
  const { lang, setLang } = useLang()

  return (
    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '0.5rem', overflow: 'hidden', flexShrink: 0 }}>
      <button
        onClick={() => setLang('pt')}
        title="Português"
        style={{
          padding: '0.35rem 0.6rem',
          fontSize: '0.75rem',
          fontWeight: '600',
          border: 'none',
          cursor: 'pointer',
          backgroundColor: lang === 'pt' ? 'rgba(255,255,255,0.25)' : 'transparent',
          color: 'white',
          transition: 'background 0.2s',
        }}
      >
        PT
      </button>
      <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'stretch' }} />
      <button
        onClick={() => setLang('en')}
        title="English"
        style={{
          padding: '0.35rem 0.6rem',
          fontSize: '0.75rem',
          fontWeight: '600',
          border: 'none',
          cursor: 'pointer',
          backgroundColor: lang === 'en' ? 'rgba(255,255,255,0.25)' : 'transparent',
          color: 'white',
          transition: 'background 0.2s',
        }}
      >
        EN
      </button>
    </div>
  )
}
