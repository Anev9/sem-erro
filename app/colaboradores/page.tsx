'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Users,
  UserPlus,
  Edit,
  Trash2,
  Mail,
  Briefcase,
  Building2
} from 'lucide-react'

interface Colaborador {
  id: string
  nome: string
  email: string
  cargo: string
  celular?: string
  ativo: boolean
  empresas?: {
    nome_fantasia: string
  }
}

export default function ColaboradoresPage() {
  const router = useRouter()
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(true)
  const [alunoId, setAlunoId] = useState<string | null>(null)

  useEffect(() => {
    verificarAutenticacao()
  }, [])

  async function verificarAutenticacao() {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      router.push('/login')
      return
    }
    const user = JSON.parse(userStr)
    if (user.role !== 'aluno') {
      router.push('/login')
      return
    }
    setAlunoId(user.id)
    await carregarColaboradores(user.id)
  }

  async function carregarColaboradores(alunoId: string) {
    try {
      setLoading(true)
      const res = await fetch(`/api/aluno/colaboradores?aluno_id=${alunoId}`)
      if (!res.ok) throw new Error('Erro ao carregar')
      setColaboradores(await res.json())
    } catch (error) {
      console.error('Erro ao carregar colaboradores:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string, nome: string) {
    if (!confirm(`Tem certeza que deseja excluir ${nome}?`)) return
    const res = await fetch('/api/aluno/colaboradores', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ativo: false })
    })
    if (!res.ok) { alert('Erro ao excluir colaborador'); return }
    alert('Colaborador excluído com sucesso!')
    if (alunoId) carregarColaboradores(alunoId)
  }

  return (
    <>
      <style>{`
        .fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .card { transition: all 0.2s ease; }
        .card:hover { transform: translateY(-2px); box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1); }
      `}</style>

      <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
          padding: '2rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                onClick={() => router.push('/dashboard-aluno')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1.25rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '500'
                }}
              >
                <ArrowLeft size={18} />
                Voltar
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '3.5rem',
                  height: '3.5rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Users size={32} style={{ color: 'white' }} />
                </div>
                <div>
                  <h1 style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    color: 'white',
                    margin: 0
                  }}>
                    Colaboradores
                  </h1>
                  <p style={{
                    fontSize: '0.95rem',
                    color: 'rgba(255, 255, 255, 0.9)',
                    margin: '0.25rem 0 0 0'
                  }}>
                    {colaboradores.length} colaborador{colaboradores.length !== 1 ? 'es' : ''} cadastrado{colaboradores.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => router.push('/colaboradores/novo')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.875rem 1.5rem',
                backgroundColor: 'white',
                color: '#f97316',
                border: 'none',
                borderRadius: '0.75rem',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: '600',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
            >
              <UserPlus size={20} />
              Novo Colaborador
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
              <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>Carregando colaboradores...</p>
            </div>
          ) : colaboradores.length === 0 ? (
            <div className="fade-in" style={{
              backgroundColor: 'white',
              borderRadius: '1rem',
              padding: '4rem 2rem',
              textAlign: 'center',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
            }}>
              <Users size={64} style={{ color: '#9ca3af', margin: '0 auto 1.5rem' }} />
              <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                Nenhum colaborador cadastrado
              </h3>
              <p style={{ color: '#6b7280', marginBottom: '2rem', fontSize: '1rem' }}>
                Comece adicionando colaboradores às suas empresas
              </p>
              <button
                onClick={() => router.push('/colaboradores/novo')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '1rem 2rem',
                  backgroundColor: '#f97316',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.75rem',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              >
                <UserPlus size={20} />
                Cadastrar Primeiro Colaborador
              </button>
            </div>
          ) : (
            <div className="fade-in" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '1.5rem'
            }}>
              {colaboradores.map(colab => (
                <div
                  key={colab.id}
                  className="card"
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  <div style={{ marginBottom: '1rem' }}>
                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      color: '#1f2937',
                      margin: '0 0 0.5rem 0'
                    }}>
                      {colab.nome}
                    </h3>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      marginBottom: '0.25rem'
                    }}>
                      <Mail size={14} />
                      {colab.email}
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      marginBottom: '0.25rem'
                    }}>
                      <Briefcase size={14} />
                      {colab.cargo}
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.875rem',
                      color: '#6b7280'
                    }}>
                      <Building2 size={14} />
                      {colab.empresas?.nome_fantasia || 'Sem empresa'}
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '0.75rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    <button
                      onClick={() => router.push(`/colaboradores/editar/${colab.id}`)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem',
                        backgroundColor: '#f97316',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '600'
                      }}
                    >
                      <Edit size={16} />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(colab.id, colab.nome)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '600'
                      }}
                    >
                      <Trash2 size={16} />
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}