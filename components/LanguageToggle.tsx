'use client'

import { useLang } from '../contexts/LanguageContext'

export function LanguageToggle({ variant = 'dark' }: { variant?: 'dark' | 'light' }) {
  const { lang, setLang } = useLang()

  if (variant === 'light') {
    return (
      <div className="flex items-center overflow-hidden rounded-xl bg-surface-2 p-1 flex-shrink-0">
        {(['pt', 'en'] as const).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            title={l === 'pt' ? 'Português' : 'English'}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
              lang === l ? 'bg-white text-ink shadow-soft-sm' : 'text-ink-muted'
            }`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>
    )
  }

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
