'use client'

import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  backHref?: string
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, backHref, actions }: PageHeaderProps) {
  const router = useRouter()

  return (
    <div className="mb-5">
      {backHref && (
        <button
          onClick={() => router.push(backHref)}
          className="mb-4 inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-sm font-medium text-ink-muted shadow-soft-sm transition-colors hover:text-ink cursor-pointer"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
