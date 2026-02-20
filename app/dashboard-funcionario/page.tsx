'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  ClipboardList,
  CheckCircle,
  Clock,
  AlertCircle,
  LogOut,
  User,
  Building2,
  Calendar
} from 'lucide-react'

interface Empresa {
  nome_fantasia: string
}

interface Colaborador {
  id: string
  nome: string
  email: string
  cargo?: string
  empresa_id: string
  auth_id: string
  ativo: boolean
  empresas?: Empresa
}

interface Checklist {
  id: string
  nome: string
  descricao?: string
  proxima_execucao?: string
  empresa_id: string
  created_at: string
  empresas?: Empresa
  status: 'pendente' | 'em_andamento' | 'concluido'
  total_perguntas: number
  respostas_count: number
}

export default function DashboardColaborador() {
  const router = useRouter()
  const [colaborador, setColaborador] = useState<Colaborador | null>(null)
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    verificarAutenticacao()
  }, [])

  async function verificarAutenticacao() {
    try {
      // Verificar se está logado
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        alert('Você precisa estar logado como colaborador')
        router.push('/login')
        return
      }

      // Buscar colaborador baseado no auth_id
      const { data: colaboradorData, error: colaboradorError } = await supabase
        .from('colaboradores')
        .select(`
          *,
          empresas (
            nome_fantasia
          )
        `)
        .eq('auth_id', user.id)
        .eq('ativo', true)
        .single()

      if (colaboradorError || !colaboradorData) {
        alert('Colaborador não encontrado. Entre em contato com seu gestor.')
        router.push('/login')
        return
      }

      setColaborador(colaboradorData)
      await carregarChecklists(colaboradorData.id)
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error)
      alert('Erro ao verificar autenticação')
    }
  }

  async function carregarChecklists(colaboradorId: string) {
    try {
      setLoading(true)

      // Buscar checklists atribuídos ao colaborador
      const { data: checklistsData, error: checklistsError } = await supabase
        .from('checklists_futuros')
        .select(`
          *,
          empresas (
            nome_fantasia
          )
        `)
        .eq('colaborador_id', colaboradorId)
        .eq('ativo', true)
        .order('proxima_execucao', { ascending: false })

      if (checklistsError) throw checklistsError

      // Para cada checklist, buscar total de perguntas e respostas
      const checklistsComStatus = await Promise.all(
        (checklistsData || []).map(async (checklist) => {
          // Buscar total de perguntas
          const { count: totalPerguntas } = await supabase
            .from('checklist_futuro_itens')
            .select('*', { count: 'exact', head: true })
            .eq('checklist_futuro_id', checklist.id)

          // Buscar respostas do colaborador
          const { count: respostasCount } = await supabase
            .from('checklist_respostas')
            .select('*', { count: 'exact', head: true })
            .eq('checklist_futuro_id', checklist.id)
            .eq('colaborador_id', colaboradorId)

          // Determinar status
          let status: 'pendente' | 'em_andamento' | 'concluido' = 'pendente'
          if (respostasCount && totalPerguntas) {
            if (respostasCount >= totalPerguntas) {
              status = 'concluido'
            } else if (respostasCount > 0) {
              status = 'em_andamento'
            }
          }

          return {
            ...checklist,
            status,
            total_perguntas: totalPerguntas || 0,
            respostas_count: respostasCount || 0
          }
        })
      )

      // Filtrar checklists nulos (fora do período) e ordenar
      setChecklists(checklistsComStatus.filter(c => c !== null) as Checklist[])
    } catch (error) {
      console.error('Erro ao carregar checklists:', error)
      alert('Erro ao carregar checklists')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      alert('Erro ao fazer logout')
    }
  }

  function responderChecklist(checklistId: string) {
    router.push(`/responder-checklist/${checklistId}`)
  }

  const checklistsPendentes = checklists.filter(c => c.status === 'pendente')
  const checklistsEmAndamento = checklists.filter(c => c.status === 'em_andamento')
  const checklistsConcluidos = checklists.filter(c => c.status === 'concluido')

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <style>{`
        .fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .card { 
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .card:hover { 
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
        }
      `}</style>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        padding: '2rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{
              width: '4rem',
              height: '4rem',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <User size={32} style={{ color: 'white' }} />
            </div>
            <div>
              <h1 style={{
                fontSize: '1.75rem',
                fontWeight: 'bold',
                color: 'white',
                margin: 0
              }}>
                Olá, {colaborador?.nome || 'Colaborador'}!
              </h1>
              <p style={{
                fontSize: '0.95rem',
                color: 'rgba(255, 255, 255, 0.9)',
                margin: '0.25rem 0 0 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Building2 size={16} />
                {colaborador?.empresas?.nome_fantasia}
                {colaborador?.cargo && ` • ${colaborador.cargo}`}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => router.push('/perfil')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: '500'
              }}
            >
              <User size={18} />
              Meu Perfil
            </button>

            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: '500'
              }}
            >
              <LogOut size={18} />
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        {/* Stats */}
        <div className="fade-in" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                backgroundColor: '#dbeafe',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ClipboardList size={24} style={{ color: '#3b82f6' }} />
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                  Total de Checklists
                </p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                  {checklists.length}
                </p>
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                backgroundColor: '#fef3c7',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Clock size={24} style={{ color: '#f59e0b' }} />
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                  Pendentes
                </p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                  {checklistsPendentes.length}
                </p>
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                backgroundColor: '#d1fae5',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircle size={24} style={{ color: '#10b981' }} />
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                  Concluídos
                </p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                  {checklistsConcluidos.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Checklists */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <p style={{ color: '#6b7280' }}>Carregando seus checklists...</p>
          </div>
        ) : checklists.length === 0 ? (
          <div className="fade-in" style={{
            backgroundColor: 'white',
            borderRadius: '1rem',
            padding: '4rem 2rem',
            textAlign: 'center',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              backgroundColor: '#f3f4f6',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem'
            }}>
              <ClipboardList size={40} style={{ color: '#9ca3af' }} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', margin: '0 0 0.5rem 0' }}>
              Nenhum checklist disponível
            </h3>
            <p style={{ fontSize: '0.95rem', color: '#6b7280', margin: 0 }}>
              Quando seu gestor atribuir checklists para você, eles aparecerão aqui.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Pendentes */}
            {checklistsPendentes.length > 0 && (
              <div className="fade-in">
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#1f2937',
                  margin: '0 0 1rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Clock size={20} style={{ color: '#f59e0b' }} />
                  Pendentes ({checklistsPendentes.length})
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                  {checklistsPendentes.map(checklist => (
                    <div
                      key={checklist.id}
                      className="card"
                      onClick={() => responderChecklist(checklist.id)}
                      style={{
                        backgroundColor: 'white',
                        borderRadius: '1rem',
                        padding: '1.5rem',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                        border: '2px solid #fef3c7'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: 0, flex: 1 }}>
                          {checklist.nome}
                        </h3>
                        <span style={{
                          padding: '0.375rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          backgroundColor: '#fef3c7',
                          color: '#92400e'
                        }}>
                          Pendente
                        </span>
                      </div>
                      {checklist.descricao && (
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 1rem 0' }}>
                          {checklist.descricao}
                        </p>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Calendar size={14} />
                          {checklist.proxima_execucao ? `Execução: ${new Date(checklist.proxima_execucao).toLocaleDateString('pt-BR')}` : ''}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <ClipboardList size={14} />
                          {checklist.total_perguntas} perguntas
                        </div>
                      </div>
                      <div style={{
                        marginTop: '1rem',
                        padding: '0.75rem',
                        backgroundColor: '#f59e0b',
                        color: 'white',
                        borderRadius: '0.5rem',
                        textAlign: 'center',
                        fontWeight: '600',
                        fontSize: '0.95rem'
                      }}>
                        Iniciar Agora →
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Em Andamento */}
            {checklistsEmAndamento.length > 0 && (
              <div className="fade-in">
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#1f2937',
                  margin: '0 0 1rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <AlertCircle size={20} style={{ color: '#3b82f6' }} />
                  Em Andamento ({checklistsEmAndamento.length})
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                  {checklistsEmAndamento.map(checklist => (
                    <div
                      key={checklist.id}
                      className="card"
                      onClick={() => responderChecklist(checklist.id)}
                      style={{
                        backgroundColor: 'white',
                        borderRadius: '1rem',
                        padding: '1.5rem',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                        border: '2px solid #dbeafe'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: 0, flex: 1 }}>
                          {checklist.nome}
                        </h3>
                        <span style={{
                          padding: '0.375rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          backgroundColor: '#dbeafe',
                          color: '#1e40af'
                        }}>
                          Em Andamento
                        </span>
                      </div>
                      {checklist.descricao && (
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 1rem 0' }}>
                          {checklist.descricao}
                        </p>
                      )}
                      <div style={{
                        marginBottom: '1rem',
                        padding: '0.75rem',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '0.5rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                          <span style={{ color: '#6b7280' }}>Progresso</span>
                          <span style={{ color: '#3b82f6', fontWeight: '600' }}>
                            {checklist.respostas_count}/{checklist.total_perguntas}
                          </span>
                        </div>
                        <div style={{
                          width: '100%',
                          height: '8px',
                          backgroundColor: '#e5e7eb',
                          borderRadius: '9999px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${(checklist.respostas_count / (checklist.total_perguntas || 1)) * 100}%`,
                            height: '100%',
                            backgroundColor: '#3b82f6',
                            borderRadius: '9999px',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>
                      <div style={{
                        marginTop: '1rem',
                        padding: '0.75rem',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        borderRadius: '0.5rem',
                        textAlign: 'center',
                        fontWeight: '600',
                        fontSize: '0.95rem'
                      }}>
                        Continuar →
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Concluídos */}
            {checklistsConcluidos.length > 0 && (
              <div className="fade-in">
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#1f2937',
                  margin: '0 0 1rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <CheckCircle size={20} style={{ color: '#10b981' }} />
                  Concluídos ({checklistsConcluidos.length})
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                  {checklistsConcluidos.map(checklist => (
                    <div
                      key={checklist.id}
                      className="card"
                      onClick={() => responderChecklist(checklist.id)}
                      style={{
                        backgroundColor: 'white',
                        borderRadius: '1rem',
                        padding: '1.5rem',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                        border: '2px solid #d1fae5'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: 0, flex: 1 }}>
                          {checklist.nome}
                        </h3>
                        <span style={{
                          padding: '0.375rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          backgroundColor: '#d1fae5',
                          color: '#065f46',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <CheckCircle size={12} />
                          Concluído
                        </span>
                      </div>
                      {checklist.descricao && (
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 1rem 0' }}>
                          {checklist.descricao}
                        </p>
                      )}
                      <div style={{
                        marginTop: '1rem',
                        padding: '0.75rem',
                        backgroundColor: '#10b981',
                        color: 'white',
                        borderRadius: '0.5rem',
                        textAlign: 'center',
                        fontWeight: '600',
                        fontSize: '0.95rem'
                      }}>
                        Ver Respostas →
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

