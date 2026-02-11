'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Calendar, Clock, CheckCircle, AlertCircle, PlayCircle, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type ChecklistFuturo = {
  id: string
  nome: string
  descricao: string | null
  tipo_negocio: string
  proxima_execucao: string
  status: string
  progresso_percentual: number
  departamento: string | null
  empresa_id: string | null
  total_itens?: number
  itens_respondidos?: number
}

export default function ChecklistsFuturosPage() {
  const router = useRouter()
  const [checklists, setChecklists] = useState<ChecklistFuturo[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<'admin' | 'aluno'>('aluno')
  const [userId, setUserId] = useState('')

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }

    const user = JSON.parse(userData)
    setUserId(user.id)
    
    // Se for funcionário, redireciona para /meus-checklists
    if (user.role !== 'admin' && user.role !== 'aluno') {
      router.push('/meus-checklists')
      return
    }
    
    setUserRole(user.role === 'admin' ? 'admin' : 'aluno')
    buscarChecklists(user.role === 'admin', user.id)
  }, [router])

  async function buscarChecklists(isAdmin: boolean, userId: string) {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('checklists_futuros')
        .select(`
          *,
          itens:checklist_futuro_itens(count)
        `)
        .order('proxima_execucao', { ascending: true })

      if (error) {
        console.error('Erro ao buscar:', error)
        throw error
      }

      const checklistsFormatados = await Promise.all(
        (data || []).map(async (checklist) => {
          const { count: respondidos } = await supabase
            .from('checklist_respostas')
            .select('*', { count: 'exact', head: true })
            .eq('checklist_futuro_id', checklist.id)

          return {
            ...checklist,
            total_itens: checklist.itens?.[0]?.count || 0,
            itens_respondidos: respondidos || 0
          }
        })
      )

      setChecklists(checklistsFormatados)

    } catch (error) {
      console.error('Erro ao buscar checklists:', error)
    } finally {
      setLoading(false)
    }
  }

  async function excluirChecklist(id: string, nome: string) {
    if (!confirm(`Tem certeza que deseja excluir "${nome}"?`)) return

    try {
      // Excluir itens primeiro
      const { error: errorItens } = await supabase
        .from('checklist_futuro_itens')
        .delete()
        .eq('checklist_futuro_id', id)

      if (errorItens) throw errorItens

      // Excluir respostas
      const { error: errorRespostas } = await supabase
        .from('checklist_respostas')
        .delete()
        .eq('checklist_futuro_id', id)

      if (errorRespostas) throw errorRespostas

      // Excluir checklist
      const { error: errorChecklist } = await supabase
        .from('checklists_futuros')
        .delete()
        .eq('id', id)

      if (errorChecklist) throw errorChecklist

      alert('Checklist excluído com sucesso!')
      buscarChecklists(userRole === 'admin', userId)

    } catch (error) {
      console.error('Erro ao excluir:', error)
      alert('Erro ao excluir checklist')
    }
  }

  function formatarData(data: string) {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  function obterCorStatus(status: string) {
    switch (status) {
      case 'concluido':
        return { bg: '#dcfce7', text: '#166534', icon: CheckCircle, label: 'Concluído' }
      case 'em_andamento':
        return { bg: '#dbeafe', text: '#1e40af', icon: PlayCircle, label: 'Em Andamento' }
      case 'pendente':
        return { bg: '#fef3c7', text: '#92400e', icon: Clock, label: 'Pendente' }
      case 'atrasado':
        return { bg: '#fee2e2', text: '#991b1b', icon: AlertCircle, label: 'Atrasado' }
      default:
        return { bg: '#f3f4f6', text: '#374151', icon: Clock, label: status }
    }
  }

  return (
    <>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem' }}>
          
          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <button
              onClick={() => router.push(userRole === 'admin' ? '/dashboard-admin' : '/dashboard-aluno')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                marginBottom: '1.5rem',
                color: '#374151',
                fontSize: '0.95rem'
              }}
            >
              <ArrowLeft size={18} />
              Voltar para Dashboard
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
                  Checklists Futuros
                </h1>
                <p style={{ color: '#6b7280' }}>
                  Gerencie os checklists que você criou
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
                  fontWeight: '600',
                  fontSize: '0.95rem'
                }}
              >
                <Plus size={20} />
                Criar Novo Checklist
              </button>
            </div>
          </div>

          {/* Loading */}
          {loading ? (
            <div style={{ 
              backgroundColor: 'white',
              borderRadius: '1rem',
              padding: '4rem',
              textAlign: 'center',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
            }}>
              <div style={{ 
                width: '50px',
                height: '50px',
                border: '4px solid #f3f4f6',
                borderTopColor: '#3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 1.5rem'
              }} />
              <p style={{ color: '#6b7280', fontSize: '1rem' }}>Carregando checklists...</p>
            </div>
          ) : checklists.length === 0 ? (
            /* Vazio */
            <div style={{
              backgroundColor: 'white',
              borderRadius: '1rem',
              padding: '4rem',
              textAlign: 'center',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
            }}>
              <Calendar size={64} style={{ margin: '0 auto 1.5rem', color: '#d1d5db' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
                Nenhum checklist criado
              </h3>
              <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
                Comece criando seu primeiro checklist futuro
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
                  fontWeight: '600'
                }}
              >
                <Plus size={20} />
                Criar Primeiro Checklist
              </button>
            </div>
          ) : (
            /* Lista de Checklists */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {checklists.map((checklist) => {
                const statusInfo = obterCorStatus(checklist.status || 'pendente')
                const StatusIcon = statusInfo.icon
                const progresso = checklist.progresso_percentual || 0

                return (
                  <div
                    key={checklist.id}
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '1rem',
                      padding: '1.5rem',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                      border: '1px solid #e5e7eb',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'
                      e.currentTarget.style.borderColor = '#3b82f6'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)'
                      e.currentTarget.style.borderColor = '#e5e7eb'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
                          {checklist.nome}
                        </h3>
                        {checklist.descricao && (
                          <p style={{ color: '#6b7280', fontSize: '0.95rem', lineHeight: '1.5' }}>
                            {checklist.descricao}
                          </p>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          padding: '0.5rem 1rem',
                          borderRadius: '9999px',
                          backgroundColor: statusInfo.bg,
                          color: statusInfo.text,
                          fontSize: '0.875rem',
                          fontWeight: '600'
                        }}>
                          <StatusIcon size={16} />
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>

                    {/* Barra de Progresso */}
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Progresso</span>
                        <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937' }}>
                          {checklist.itens_respondidos || 0} / {checklist.total_itens || 0} itens ({progresso}%)
                        </span>
                      </div>
                      <div style={{
                        width: '100%',
                        height: '0.5rem',
                        backgroundColor: '#e5e7eb',
                        borderRadius: '9999px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${progresso}%`,
                          height: '100%',
                          backgroundColor: progresso === 100 ? '#22c55e' : '#3b82f6',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>

                    {/* Informações */}
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <Calendar size={16} />
                        {formatarData(checklist.proxima_execucao)}
                      </div>
                      {checklist.tipo_negocio && (
                        <div>📋 {checklist.tipo_negocio}</div>
                      )}
                      {checklist.departamento && (
                        <div>🏢 {checklist.departamento}</div>
                      )}
                    </div>

                    {/* Botões */}
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => router.push(`/responder-checklist/${checklist.id}`)}
                        style={{
                          padding: '0.625rem 1.25rem',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '0.95rem'
                        }}
                      >
                        Ver Detalhes
                      </button>
                      <button
                        onClick={() => excluirChecklist(checklist.id, checklist.nome)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.625rem 1.25rem',
                          backgroundColor: 'transparent',
                          color: '#ef4444',
                          border: '1px solid #ef4444',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '0.95rem'
                        }}
                      >
                        <Trash2 size={16} />
                        Excluir
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}