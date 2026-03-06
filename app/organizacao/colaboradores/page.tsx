'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Search, UserCheck, UserX, Building2 } from 'lucide-react'

interface Colaborador {
  id: string
  nome: string
  email: string
  cargo: string
  celular: string | null
  ativo: boolean
  created_at: string
  empresas: { nome_fantasia: string } | null
}

export default function ColaboradoresAdminPage() {
  const router = useRouter()
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [ativoFilter, setAtivoFilter] = useState('todos')

  useEffect(() => {
    fetch('/api/admin/colaboradores')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setColaboradores(data)
      })
      .finally(() => setLoading(false))
  }, [])

  const filtrados = colaboradores.filter((c) => {
    const search = searchTerm.toLowerCase()
    const matchSearch =
      c.nome.toLowerCase().includes(search) ||
      c.email.toLowerCase().includes(search) ||
      (c.cargo || '').toLowerCase().includes(search) ||
      (c.empresas?.nome_fantasia || '').toLowerCase().includes(search)

    const matchAtivo =
      ativoFilter === 'todos' ||
      (ativoFilter === 'ativos' && c.ativo) ||
      (ativoFilter === 'inativos' && !c.ativo)

    return matchSearch && matchAtivo
  })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        <button
          onClick={() => router.push('/organizacao')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1rem', backgroundColor: 'white',
            border: '1px solid #e5e7eb', borderRadius: '0.5rem',
            cursor: 'pointer', marginBottom: '2rem', color: '#374151'
          }}
        >
          <ArrowLeft size={18} />
          Voltar
        </button>

        <div style={{ backgroundColor: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.25rem' }}>
                Colaboradores
              </h1>
              <p style={{ color: '#6b7280' }}>
                {colaboradores.length} colaborador{colaboradores.length !== 1 ? 'es' : ''} cadastrado{colaboradores.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => router.push('/organizacao/colaboradores/criar')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.75rem 1.5rem', backgroundColor: '#10b981',
                color: 'white', border: 'none', borderRadius: '0.5rem',
                cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem'
              }}
            >
              <Plus size={18} />
              Novo Colaborador
            </button>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="text"
                placeholder="Buscar por nome, email, cargo ou empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem',
                  border: '1px solid #e5e7eb', borderRadius: '0.5rem',
                  fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>
            <select
              value={ativoFilter}
              onChange={(e) => setAtivoFilter(e.target.value)}
              style={{
                padding: '0.75rem 1rem', border: '1px solid #e5e7eb',
                borderRadius: '0.5rem', fontSize: '0.95rem',
                outline: 'none', cursor: 'pointer', backgroundColor: 'white'
              }}
            >
              <option value="todos">Todos</option>
              <option value="ativos">Apenas ativos</option>
              <option value="inativos">Apenas inativos</option>
            </select>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>Carregando...</div>
          ) : filtrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
              {searchTerm || ativoFilter !== 'todos' ? 'Nenhum colaborador encontrado para esse filtro.' : 'Nenhum colaborador cadastrado ainda.'}
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {filtrados.map((c) => (
                <div
                  key={c.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '1.25rem 1.5rem', border: '1px solid #e5e7eb',
                    borderRadius: '0.75rem', backgroundColor: '#f9fafb',
                    flexWrap: 'wrap'
                  }}
                >
                  <div
                    style={{
                      width: '3rem', height: '3rem', borderRadius: '50%',
                      backgroundColor: c.ativo ? '#d1fae5' : '#fee2e2',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {c.ativo
                      ? <UserCheck size={22} style={{ color: '#10b981' }} />
                      : <UserX size={22} style={{ color: '#ef4444' }} />
                    }
                  </div>

                  <div style={{ flex: 1, minWidth: '180px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: '600', color: '#1f2937', fontSize: '1rem' }}>{c.nome}</span>
                      <span style={{
                        padding: '0.125rem 0.625rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '500',
                        backgroundColor: c.ativo ? '#d1fae5' : '#fee2e2',
                        color: c.ativo ? '#065f46' : '#991b1b'
                      }}>
                        {c.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
                      {c.cargo} • {c.email}
                    </p>
                    {c.celular && (
                      <p style={{ color: '#9ca3af', fontSize: '0.8rem', margin: '0.125rem 0 0' }}>{c.celular}</p>
                    )}
                  </div>

                  {c.empresas && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#6b7280', fontSize: '0.875rem' }}>
                      <Building2 size={16} style={{ color: '#8b5cf6' }} />
                      {c.empresas.nome_fantasia}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
