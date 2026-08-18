'use client'

import { ReactNode } from 'react'

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'brand' | 'info'

interface BadgeProps {
  children: ReactNode
  tone?: Tone
}

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-ink-muted',
  success: 'bg-teal-tint text-teal',
  warning: 'bg-amber-tint text-amber',
  danger: 'bg-coral-tint text-coral',
  brand: 'bg-brand-tint text-brand',
  info: 'bg-violet-tint text-violet',
}

export function Badge({ children, tone = 'neutral' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${toneClasses[tone]}`}>
      {children}
    </span>
  )
}
