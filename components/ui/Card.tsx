'use client'

import { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  interactive?: boolean
}

export function Card({ children, interactive = false, className = '', ...rest }: CardProps) {
  return (
    <div
      className={`bg-white rounded-3xl shadow-soft ${
        interactive ? 'cursor-pointer transition-colors hover:bg-surface-2' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
