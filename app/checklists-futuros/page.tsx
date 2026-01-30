'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, ChevronLeft, ChevronRight, Info, Search } from 'lucide-react'

export default function ChecklistsFuturosPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      {/* Header com navegação */}
      <div style={{ 
        backgroundColor: 'white', 
        borderBottom: '1px solid #e5e7eb',
        padding: '1rem 0'
      }}>
        <div style={{ 
          maxWidth: '1400px', 
          margin: '0 auto', 
          padding: '0 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <button
            onClick={() => router.push('/dashboard-admin')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#374151',
              fontSize: '0.95rem'
            }}
          >
            <ArrowLeft size={18} />
            Voltar
          </button>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              style={{
                padding: '0.5rem',
                backgroundColor: '#f3f4f6',
                border: '1px solid #e5e7eb',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ChevronLeft size={20} color="#6b7280" />
            </button>
            <button
              style={{
                padding: '0.5rem',
                backgroundColor: '#334155',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ChevronRight size={20} color="white" />
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        
        {/* Cabeçalho */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '2rem', 
              fontWeight: 'bold', 
              color: '#1f2937',
              margin: '0 0 0.5rem 0'
            }}>
              Checklists Programados
            </h1>
            <p style={{ 
              color: '#6b7280', 
              fontSize: '1rem',
              margin: 0
            }}>
              Gerencie seus checklists recorrentes
            </p>
          </div>
          
          <button
            onClick={() => router.push('/checklists-futuros/criar')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '0.95rem',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
          >
            <Plus size={18} />
            Criar Novo Checklist
          </button>
        </div>

        {/* Campo de busca */}
        <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
          <Search
            size={20}
            style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9ca3af',
              pointerEvents: 'none'
            }}
          />
          <input
            type="text"
            placeholder="Pesquisar checklists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.875rem 1rem 0.875rem 3rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              outline: 'none',
              backgroundColor: 'white'
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
          />
        </div>

        {/* Alerta informativo */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          padding: '1rem 1.25rem',
          backgroundColor: '#dbeafe',
          borderLeft: '4px solid #3b82f6',
          borderRadius: '0.5rem',
          marginBottom: '2rem'
        }}>
          <Info size={20} style={{ color: '#3b82f6', flexShrink: 0, marginTop: '0.125rem' }} />
          <p style={{ 
            color: '#1e40af', 
            fontSize: '0.95rem',
            margin: 0,
            lineHeight: '1.6'
          }}>
            Os checklists programados nesta tela serão repetidos conforme a configuração de dias definida. 
            Eles aparecerão automaticamente na tela de checklists agendados, sendo criados durante a 
            madrugada do dia anterior à programação.
          </p>
        </div>

        {/* Estado vazio */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          padding: '4rem 2rem',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{
            width: '4rem',
            height: '4rem',
            margin: '0 auto 1.5rem',
            backgroundColor: '#f3f4f6',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Plus size={32} style={{ color: '#9ca3af' }} />
          </div>
          
          <h3 style={{ 
            fontSize: '1.25rem', 
            fontWeight: '600', 
            color: '#1f2937',
            marginBottom: '0.5rem'
          }}>
            Nenhum checklist programado ainda.
          </h3>
          
          <p style={{ 
            color: '#6b7280', 
            fontSize: '0.95rem',
            marginBottom: '1.5rem'
          }}>
            Clique em "Criar Novo Checklist" para começar.
          </p>

          <button
            onClick={() => router.push('/checklists-futuros/criar')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '0.95rem',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
          >
            <Plus size={18} />
            Criar Primeiro Checklist
          </button>
        </div>
      </div>
    </div>
  )
}