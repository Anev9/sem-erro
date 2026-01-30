'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Briefcase } from 'lucide-react'

export default function TiposNegocioPage() {
  const router = useRouter()

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        
        <button
          onClick={() => router.push('/organizacao')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            marginBottom: '2rem',
            color: '#374151'
          }}
        >
          <ArrowLeft size={18} />
          Voltar
        </button>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
        }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <Briefcase size={32} style={{ color: '#f97316' }} />
            Tipos de Negócio
          </h1>
          <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
            Defina e organize os tipos de negócio
          </p>

          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            backgroundColor: '#f9fafb',
            borderRadius: '0.75rem',
            border: '2px dashed #e5e7eb'
          }}>
            <Briefcase size={64} style={{ margin: '0 auto 1rem', color: '#9ca3af' }} />
            <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>
              Funcionalidade em desenvolvimento
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}