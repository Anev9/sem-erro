'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Download, Plus, Search, CheckCircle, XCircle, Pencil, Building2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Aluno {
  id: number
  programa: string
  clientes: string
  'e-mail': string
  telefone: string
  tipo: string
  ativo: boolean
  cidade: string
  estado: string
  cnpj: string
  created_at: string
}

export default function GruposEmpresaPage() {
  const router = useRouter()
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [ativoFilter, setAtivoFilter] = useState('todas')
  const [ordenacao, setOrdenacao] = useState('nome')

  useEffect(() => { buscarAlunos() }, [])

  async function buscarAlunos() {
    const { data, error } = await supabase
      .from('alunos')
      .select('*')
      .order('clientes', { ascending: true })
    if (!error) setAlunos(data || [])
    setLoading(false)
  }

  async function toggleAtivo(aluno: Aluno) {
    setToggling(aluno.id)
    const novoStatus = !aluno.ativo
    const { error } = await supabase.from('alunos').update({ ativo: novoStatus }).eq('id', aluno.id)
    if (!error) {
      setAlunos((prev) => prev.map((a) => (a.id === aluno.id ? { ...a, ativo: novoStatus } : a)))
    }
    setToggling(null)
  }

  function exportarCSV() {
    const headers = ['ID', 'Nome', 'Programa', 'Email', 'Telefone', 'Cidade', 'Estado', 'CNPJ', 'Ativo']
    const rows = alunosFiltrados.map((a) => [
      a.id, a.clientes || '', a.programa || '', a['e-mail'] || '',
      a.telefone || '', a.cidade || '', a.estado || '', a.cnpj || '',
      a.ativo ? 'Sim' : 'Não',
    ])
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `grupos-empresa-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  function aplicarOrdenacao(lista: Aluno[]) {
    const copia = [...lista]
    if (ordenacao === 'nome') return copia.sort((a, b) => (a.clientes || '').localeCompare(b.clientes || ''))
    if (ordenacao === 'programa') return copia.sort((a, b) => (a.programa || '').localeCompare(b.programa || ''))
    return copia.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  const alunosFiltrados = aplicarOrdenacao(
    alunos.filter((aluno) => {
      const s = searchTerm.toLowerCase()
      const matchSearch =
        (aluno.clientes || '').toLowerCase().includes(s) ||
        (aluno.programa || '').toLowerCase().includes(s) ||
        (aluno['e-mail'] || '').toLowerCase().includes(s) ||
        (aluno.cidade || '').toLowerCase().includes(s)
      const matchAtivo =
        ativoFilter === 'todas' ||
        (ativoFilter === 'ativas' && aluno.ativo === true) ||
        (ativoFilter === 'inativas' && aluno.ativo === false)
      return matchSearch && matchAtivo
    })
  )

  const totalAtivos = alunos.filter((a) => a.ativo).length
  const totalInativos = alunos.filter((a) => !a.ativo).length

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        <button
          onClick={() => router.push('/dashboard-admin')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1rem', backgroundColor: 'white',
            border: '1px solid #e5e7eb', borderRadius: '0.5rem',
            cursor: 'pointer', marginBottom: '2rem', color: '#374151', fontSize: '0.9rem'
          }}
        >
          <ArrowLeft size={16} /> Voltar
        </button>

        {/* Cards resumo */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Total de Clientes', value: alunos.length, color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
            { label: 'Ativos', value: totalAtivos, color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },
            { label: 'Inativos', value: totalInativos, color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
          ].map((card) => (
            <div key={card.label} style={{
              backgroundColor: card.bg, borderRadius: '0.75rem',
              padding: '1.25rem 1.5rem', border: `1px solid ${card.border}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Building2 size={16} style={{ color: card.color }} />
                <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>{card.label}</p>
              </div>
              <p style={{ color: card.color, fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{card.value}</p>
            </div>
          ))}
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '1.5rem 2rem', borderBottom: '1px solid #f3f4f6', flexWrap: 'wrap', gap: '1rem'
          }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                Grupos de Empresas
              </h1>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
                {alunosFiltrados.length} resultado{alunosFiltrados.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => router.push('/organizacao/grupos-empresa/criar')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.625rem 1.25rem', backgroundColor: '#10b981',
                  color: 'white', border: 'none', borderRadius: '0.5rem',
                  cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem'
                }}
              >
                <Plus size={16} /> Criar novo
              </button>
              <button
                onClick={exportarCSV}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.625rem 1.25rem', backgroundColor: '#3b82f6',
                  color: 'white', border: 'none', borderRadius: '0.5rem',
                  cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem'
                }}
              >
                <Download size={16} /> Exportar CSV
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div style={{ padding: '1rem 2rem', borderBottom: '1px solid #f3f4f6', backgroundColor: '#fafafa' }}>
            {/* Linha 1: busca + ordenação */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.875rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                <Search size={15} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Buscar por nome, programa, email ou cidade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%', padding: '0.625rem 2.5rem 0.625rem 2.25rem',
                    border: '1px solid #e5e7eb', borderRadius: '0.5rem',
                    fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
                    backgroundColor: 'white', transition: 'border-color 0.2s, box-shadow 0.2s'
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none' }}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    style={{
                      position: 'absolute', right: '0.625rem', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af',
                      fontSize: '1rem', lineHeight: 1, padding: '0.1rem 0.25rem'
                    }}
                  >×</button>
                )}
              </div>
              <select
                value={ordenacao}
                onChange={(e) => setOrdenacao(e.target.value)}
                style={{
                  padding: '0.625rem 0.875rem', border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem', fontSize: '0.875rem', outline: 'none',
                  cursor: 'pointer', backgroundColor: 'white', color: '#374151',
                  minWidth: '180px'
                }}
              >
                <option value="nome">↕ Ordenar por nome</option>
                <option value="programa">↕ Ordenar por programa</option>
                <option value="data">↕ Ordenar por data</option>
              </select>
            </div>

            {/* Linha 2: pills de status */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', color: '#9ca3af', marginRight: '0.25rem' }}>Status:</span>
              {[
                { value: 'todas', label: 'Todos', count: alunos.length },
                { value: 'ativas', label: 'Ativos', count: totalAtivos },
                { value: 'inativas', label: 'Inativos', count: totalInativos },
              ].map((opt) => {
                const active = ativoFilter === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => setAtivoFilter(opt.value)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                      padding: '0.375rem 0.875rem', borderRadius: '9999px',
                      fontSize: '0.8rem', fontWeight: active ? '700' : '500',
                      cursor: 'pointer', transition: 'all 0.15s',
                      border: active ? '1.5px solid transparent' : '1.5px solid #e5e7eb',
                      backgroundColor: active
                        ? opt.value === 'ativas' ? '#dcfce7'
                          : opt.value === 'inativas' ? '#fee2e2'
                          : '#dbeafe'
                        : 'white',
                      color: active
                        ? opt.value === 'ativas' ? '#15803d'
                          : opt.value === 'inativas' ? '#b91c1c'
                          : '#1d4ed8'
                        : '#6b7280',
                    }}
                  >
                    {opt.label}
                    <span style={{
                      backgroundColor: active ? 'rgba(0,0,0,0.1)' : '#f3f4f6',
                      color: active ? 'inherit' : '#9ca3af',
                      borderRadius: '9999px', padding: '0 0.375rem',
                      fontSize: '0.72rem', fontWeight: '700'
                    }}>
                      {opt.count}
                    </span>
                  </button>
                )
              })}
              {(searchTerm || ativoFilter !== 'todas') && (
                <button
                  onClick={() => { setSearchTerm(''); setAtivoFilter('todas') }}
                  style={{
                    marginLeft: '0.5rem', padding: '0.375rem 0.75rem',
                    border: '1px dashed #d1d5db', borderRadius: '9999px',
                    fontSize: '0.8rem', color: '#9ca3af', cursor: 'pointer',
                    backgroundColor: 'transparent'
                  }}
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </div>

          {/* Tabela */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
              Carregando...
            </div>
          ) : alunosFiltrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>
              <Building2 size={40} style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.3 }} />
              Nenhum resultado encontrado
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    {['Status', 'Nome', 'Programa', 'Email', 'Localização', 'Telefone', 'Ações'].map((h) => (
                      <th key={h} style={{
                        padding: '0.75rem 1rem', textAlign: 'left',
                        fontSize: '0.75rem', fontWeight: '600',
                        color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em',
                        whiteSpace: 'nowrap'
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {alunosFiltrados.map((aluno, idx) => (
                    <tr
                      key={aluno.id}
                      style={{
                        borderBottom: '1px solid #f3f4f6',
                        backgroundColor: idx % 2 === 0 ? 'white' : '#fafafa',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0fdf4')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? 'white' : '#fafafa')}
                    >
                      <td style={{ padding: '0.875rem 1rem', whiteSpace: 'nowrap' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                          padding: '0.25rem 0.625rem', borderRadius: '9999px',
                          fontSize: '0.75rem', fontWeight: '600',
                          backgroundColor: aluno.ativo ? '#dcfce7' : '#fee2e2',
                          color: aluno.ativo ? '#15803d' : '#b91c1c'
                        }}>
                          {aluno.ativo
                            ? <><CheckCircle size={12} /> Ativo</>
                            : <><XCircle size={12} /> Inativo</>
                          }
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span style={{ fontWeight: '600', color: '#111827', fontSize: '0.9rem' }}>
                          {aluno.clientes || <em style={{ color: '#9ca3af' }}>Sem nome</em>}
                        </span>
                        {aluno.cnpj && (
                          <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.1rem 0 0' }}>
                            {aluno.cnpj}
                          </p>
                        )}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: '#6b7280', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                        {aluno.programa || <span style={{ color: '#d1d5db' }}>—</span>}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                        {aluno['e-mail'] || <span style={{ color: '#d1d5db' }}>—</span>}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: '#6b7280', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                        {aluno.cidade && aluno.estado
                          ? `${aluno.cidade} / ${aluno.estado}`
                          : aluno.cidade || aluno.estado || <span style={{ color: '#d1d5db' }}>—</span>
                        }
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: '#6b7280', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                        {aluno.telefone || <span style={{ color: '#d1d5db' }}>—</span>}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => toggleAtivo(aluno)}
                            disabled={toggling === aluno.id}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '0.25rem',
                              padding: '0.375rem 0.75rem', border: 'none', borderRadius: '0.375rem',
                              cursor: toggling === aluno.id ? 'not-allowed' : 'pointer',
                              fontWeight: '600', fontSize: '0.8rem',
                              backgroundColor: aluno.ativo ? '#fee2e2' : '#dcfce7',
                              color: aluno.ativo ? '#dc2626' : '#16a34a',
                              opacity: toggling === aluno.id ? 0.6 : 1
                            }}
                          >
                            {toggling === aluno.id
                              ? '...'
                              : aluno.ativo
                                ? <><XCircle size={13} /> Desativar</>
                                : <><CheckCircle size={13} /> Ativar</>
                            }
                          </button>
                          <button
                            onClick={() => router.push(`/organizacao/grupos-empresa/editar/${aluno.id}`)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '0.25rem',
                              padding: '0.375rem 0.75rem', border: '1px solid #e5e7eb',
                              borderRadius: '0.375rem', cursor: 'pointer',
                              fontWeight: '500', fontSize: '0.8rem',
                              backgroundColor: 'white', color: '#374151'
                            }}
                          >
                            <Pencil size={13} /> Editar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
