'use client'

import { useRouter } from 'next/navigation'
import { Building2, Users, Briefcase, ArrowLeft } from 'lucide-react'

export default function OrganizacaoPage() {
  const router = useRouter()

  const cards = [
    {
      title: 'Grupos de Empresa',
      description: 'Gerencie os alunos e empresas cadastradas no sistema',
      icon: Building2,
      href: '/organizacao/grupos-empresa',
      color: '#3b82f6'
    },
    {
      title: 'Copilotos',
      description: 'Configure e gerencie os copilotos do sistema',
      icon: Users,
      href: '/organizacao/copilotos',
      color: '#8b5cf6'
    },
    {
      title: 'Tipos de Negócio',
      description: 'Defina e organize os tipos de negócio',
      icon: Briefcase,
      href: '/organizacao/tipos-negocio',
      color: '#f97316'
    }
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        
        <button
          onClick={() => router.push('/dashboard-admin')}
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
            color: '#374151',
            fontSize: '0.95rem'
          }}
        >
          <ArrowLeft size={18} />
          Voltar ao Dashboard
        </button>

        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
            Organização
          </h1>
          <p style={{ color: '#6b7280', fontSize: '1rem' }}>
            Gerencie grupos de empresa, copilotos e tipos de negócio
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem'
        }}>
          {cards.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.title}
                onClick={() => router.push(card.href)}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '1rem',
                  padding: '2rem',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: '2px solid transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.1)'
                  e.currentTarget.style.borderColor = card.color
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)'
                  e.currentTarget.style.borderColor = 'transparent'
                }}
              >
                <div
                  style={{
                    width: '4rem',
                    height: '4rem',
                    borderRadius: '1rem',
                    backgroundColor: `${card.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.5rem'
                  }}
                >
                  <Icon size={32} style={{ color: card.color }} />
                </div>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: '#1f2937',
                  marginBottom: '0.5rem'
                }}>
                  {card.title}
                </h3>
                <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>
                  {card.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}