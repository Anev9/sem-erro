'use client'

import { useState, useEffect } from 'react'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle({ variant = 'dark' }: { variant?: 'dark' | 'light' }) {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    setDark(saved === 'dark')
  }, [])

  function toggle() {
    const next = !dark
    if (next) {
      document.documentElement.setAttribute('data-theme', 'dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
      localStorage.setItem('theme', 'light')
    }
    setDark(next)
  }

  if (variant === 'light') {
    return (
      <button
        onClick={toggle}
        title={dark ? 'Modo claro' : 'Modo escuro'}
        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition-colors ${
          dark ? 'bg-amber-tint text-amber' : 'bg-surface-2 text-ink-muted'
        }`}
      >
        {dark ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      title={dark ? 'Modo claro' : 'Modo escuro'}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '2.25rem',
        height: '2.25rem',
        padding: 0,
        backgroundColor: dark ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.12)',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '0.5rem',
        cursor: 'pointer',
        color: dark ? '#fbbf24' : 'white',
        transition: 'background 0.2s ease',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = dark ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.2)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = dark ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.12)'
      }}
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}
