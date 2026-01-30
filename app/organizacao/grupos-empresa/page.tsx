'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Download, Plus, Filter } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Aluno {
  id: number
  programa: string
  clientes: string
  'e-mail': string
  telefone: string
  tipo: string
  ativo: boolean
  created_at: string
}

export default function GruposEmpresaPage() {
  const router = useRouter()
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [tipoFilter, setTipoFilter] = useState('todos')
  const [ativoFilter, setAtivoFilter] = useState('todas')
  const [ordenacao, setOrdenacao] = useState('data')

  useEffect(() => {
    buscarAlunos()
  }, [])

  async function buscarAlunos() {
    try {
      const { data, error } = await supabase
        .from('alunos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setAlunos(data || [])
    } catch (error) {
      console.error('Erro ao buscar alunos:', error)
    } finally {
      setLoading(false)
    }
  }

  function exportarCSV() {
    const headers = ['ID', 'Programa', 'Cliente', 'Email', 'Telefone', 'Tipo', 'Ativo']
    const rows = alunosFiltrados.map(a => [
      a.id,
      a.programa || '',
      a.clientes || '',
      a['e-mail'] || '',
      a.telefone || '',
      a.tipo || '',
      a.ativo ? 'Sim' : 'Não'
    ])
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `grupos-empresa-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  function aplicarOrdenacao(lista: Aluno[]) {
    const copia = [...lista]
    
    if (ordenacao === 'nome') {
      return copia.sort((a, b) => (a.clientes || '').localeCompare(b.clientes || ''))
    } else if (ordenacao === 'programa') {
      return copia.sort((a, b) => (a.programa || '').localeCompare(b.programa || ''))
    } else {
      return copia.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }
  }

  const alunosFiltrados = aplicarOrdenacao(
    alunos.filter(aluno => {
      const searchLower = searchTerm.toLowerCase()
      const matchSearch = 
        (aluno.clientes || '').toLowerCase().includes(searchLower) ||
        (aluno.programa || '').toLowerCase().includes(searchLower) ||
        (aluno['e-mail'] || '').toLowerCase().includes(searchLower)
      
      const matchTipo = tipoFilter === 'todos' || aluno.tipo === tipoFilter
      
      const matchAtivo = 
        ativoFilter === 'todas' ||
        (ativoFilter === 'ativas' && aluno.ativo === true) ||
        (ativoFilter === 'inativas' && aluno.ativo === false)
      
      return matchSearch && matchTipo && matchAtivo
    })
  )

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
          
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>
              Grupos de empresas
            </h1>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => router.push('/organizacao/grupos-empresa/criar')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '0.95rem'
                }}
              >
                <Plus size={18} />
                Criar novo
              </button>
              
              <button
                onClick={exportarCSV}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '0.95rem'
                }}
              >
                <Download size={18} />
                Exportar CSV
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <select
                style={{
                  padding: '0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '0.95rem',
                  outline: 'none',
                  cursor: 'pointer',
                  backgroundColor: 'white'
                }}
              >
                <option>Todos os status</option>
              </select>

              <select
                value={tipoFilter}
                onChange={(e) => setTipoFilter(e.target.value)}
                style={{
                  padding: '0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '0.95rem',
                  outline: 'none',
                  cursor: 'pointer',
                  backgroundColor: 'white'
                }}
              >
                <option value="todos">Todos os tipos de empresas</option>
                <option value="admin">Admin</option>
                <option value="aluno">Aluno</option>
              </select>

              <select
                value={ativoFilter}
                onChange={(e) => setAtivoFilter(e.target.value)}
                style={{
                  padding: '0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '0.95rem',
                  outline: 'none',
                  cursor: 'pointer',
                  backgroundColor: 'white'
                }}
              >
                <option value="todas">Ativas e inativas</option>
                <option value="ativas">Apenas ativas</option>
                <option value="inativas">Apenas inativas</option>
              </select>

              <select
                value={ordenacao}
                onChange={(e) => setOrdenacao(e.target.value)}
                style={{
                  padding: '0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '0.95rem',
                  outline: 'none',
                  cursor: 'pointer',
                  backgroundColor: 'white'
                }}
              >
                <option value="data">Ordenar por data de cadastro</option>
                <option value="nome">Ordenar por nome</option>
                <option value="programa">Ordenar por programa</option>
              </select>
            </div>

            <button
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
                marginBottom: '1.5rem'
              }}
            >
              <Filter size={18} />
              Filtrar
            </button>

            <input
              type="text"
              placeholder="Digite para filtrar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                outline: 'none',
                backgroundColor: 'white'
              }}
            />
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
              Carregando...
            </div>
          ) : alunosFiltrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
              Nenhum resultado encontrado
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {alunosFiltrados.map((aluno) => (
                <div
                  key={aluno.id}
                  onClick={() => router.push(`/organizacao/grupos-empresa/editar/${aluno.id}`)}
                  style={{
                    padding: '1.5rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.75rem',
                    backgroundColor: '#f9fafb',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6'
                    e.currentTarget.style.borderColor = '#3b82f6'
                    e.currentTarget.style.transform = 'translateX(4px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb'
                    e.currentTarget.style.borderColor = '#e5e7eb'
                    e.currentTarget.style.transform = 'translateX(0)'
                  }}
                >
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
                    {aluno.clientes || 'Sem nome'}
                  </h3>
                  <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>
                    Acesso ativo: <strong style={{ color: aluno.ativo ? '#10b981' : '#ef4444' }}>
                      {aluno.ativo ? 'True' : 'False'}
                    </strong>
                  </p>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    Programa: {aluno.programa || 'N/A'} • Email: {aluno['e-mail'] || 'N/A'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}