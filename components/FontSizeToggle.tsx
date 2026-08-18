'use client'

import { useEffect, useState } from 'react'
import { Minus, Plus } from 'lucide-react'

const STEPS = [15, 16, 17, 18, 19, 20]
const DEFAULT_SIZE = 17

export function FontSizeToggle() {
  const [size, setSize] = useState(DEFAULT_SIZE)

  useEffect(() => {
    const saved = Number(localStorage.getItem('fontSize'))
    if (saved && STEPS.includes(saved)) setSize(saved)
    else applySize(DEFAULT_SIZE)
  }, [])

  function applySize(next: number) {
    document.documentElement.style.fontSize = `${next}px`
    localStorage.setItem('fontSize', String(next))
    setSize(next)
  }

  function step(dir: 1 | -1) {
    const idx = STEPS.indexOf(size)
    const nextIdx = Math.min(STEPS.length - 1, Math.max(0, idx + dir))
    applySize(STEPS[nextIdx])
  }

  return (
    <div className="flex items-center overflow-hidden rounded-xl bg-surface-2 p-1 flex-shrink-0">
      <button
        onClick={() => step(-1)}
        disabled={size === STEPS[0]}
        title="Diminuir texto"
        className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-white disabled:opacity-30"
      >
        <Minus size={13} />
      </button>
      <span className="w-6 text-center text-[11px] font-bold text-ink-faint">A</span>
      <button
        onClick={() => step(1)}
        disabled={size === STEPS[STEPS.length - 1]}
        title="Aumentar texto"
        className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-white disabled:opacity-30"
      >
        <Plus size={13} />
      </button>
    </div>
  )
}
