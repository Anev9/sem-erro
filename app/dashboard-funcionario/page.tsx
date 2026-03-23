'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  status: 'pendente' | 'em_andamento' | 'concluido' | 'atrasado'
  total_perguntas: number
  respostas_count: number
  recorrencia?: string | null
  dias_tolerancia?: number | null
}

export default function DashboardColaborador() {
  const router = useRouter()
  const [colaborador, setColaborador] = useState<Colaborador | null>(null)
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [loading, setLoading] = useState(true)
  const [erroChecklists, setErroChecklists] = useState(false)

  useEffect(() => {
    console.log('[DASH] useEffect disparado')
    verificarAutenticacao()
  }, [])

  async function verificarAutenticacao() {
    try {
      console.log('[DASH] iniciando verificação')
      let user = null

      // 1. Tentar localStorage primeiro (caminho rápido)
      const userStr = localStorage.getItem('user')
      console.log('[DASH] localStorage:', userStr ? 'encontrado' : 'VAZIO')
      if (userStr) {
        const parsed = JSON.parse(userStr)
        console.log('[DASH] role:', parsed.role)
        if (parsed.role === 'colaborador') {
          user = parsed
        }
      }

      // 2. Fallback: verificar pelo cookie no servidor
      if (!user) {
        console.log('[DASH] buscando via cookie...')
        const res = await fetch('/api/colaborador/sessao')
        console.log('[DASH] sessao status:', res.status)
        if (!res.ok) {
          console.log('[DASH] → redireciona para login (sem sessão)')
          window.location.href = '/login'
          return
        }
        user = await res.json()
        localStorage.setItem('user', JSON.stringify(user))
      }

      console.log('[DASH] ✓ autenticado como', user.nome)
      setColaborador({
        id: user.id,
        auth_id: user.auth_id,
        nome: user.nome,
        email: user.email,
        cargo: user.cargo,
        empresa_id: user.empresa_id,
        ativo: true,
        empresas: user.empresa_nome ? { nome_fantasia: user.empresa_nome } : undefined
      })

      await carregarChecklists(user.id)
    } catch (error) {
      console.error('[DASH] ERRO:', error)
      window.location.href = '/login'
    }
  }

  async function carregarChecklists(colaboradorId: string) {
    try {
      setLoading(true)

      const res = await fetch(`/api/colaborador/checklists?colaborador_id=${colaboradorId}`)
      if (!res.ok) throw new Error('Erro ao carregar checklists')
      // A API já retorna os dados com contagens
      const checklistsData: (Checklist & { proxima_execucao?: string; dias_tolerancia?: number; recorrencia?: string })[] = await res.json()

      const checklistsComStatus = checklistsData.map((checklist) => {
        const totalPerguntas = checklist.total_perguntas || 0
        const respostasCount = checklist.respostas_count || 0

        let status: 'pendente' | 'em_andamento' | 'concluido' | 'atrasado' = 'pendente'
        if (respostasCount >= totalPerguntas && totalPerguntas > 0) {
          status = 'concluido'
        } else if (respostasCount > 0) {
          status = 'em_andamento'
        }

        if (status !== 'concluido' && checklist.proxima_execucao) {
          const dataLimite = new Date(checklist.proxima_execucao)
          dataLimite.setDate(dataLimite.getDate() + (checklist.dias_tolerancia || 0))
          dataLimite.setHours(23, 59, 59, 999)
          if (new Date() > dataLimite) status = 'atrasado'
        }

        return { ...checklist, status, total_perguntas: totalPerguntas, respostas_count: respostasCount }
      })

      setChecklists(checklistsComStatus as Checklist[])
    } catch (error) {
      console.error('Erro ao carregar checklists:', error)
      setErroChecklists(true)
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    localStorage.removeItem('user')
    fetch('/api/colaborador/sessao', { method: 'POST' }) // limpar cookie
    router.push('/login')
  }

  function responderChecklist(checklistId: string) {
    router.push(`/responder-checklist/${checklistId}`)
  }

  const checklistsPendentes = checklists.filter(c => c.status === 'pendente')
  const checklistsEmAndamento = checklists.filter(c => c.status === 'em_andamento')
  const checklistsConcluidos = checklists.filter(c => c.status === 'concluido')
  const checklistsAtrasados = checklists.filter(c => c.status === 'atrasado')

  const labelRecorrencia: Record<string, string> = {
    diaria: '🔄 Diária',
    semanal: '🔄 Semanal',
    mensal: '🔄 Mensal'
  }

  function calcularJanela(dataStr: string, dias: number) {
    const data = new Date(dataStr)
    const inicio = new Date(data)
    inicio.setDate(inicio.getDate() - dias)
    const fim = new Date(data)
    fim.setDate(fim.getDate() + dias)
    return {
      inicio: inicio.toLocaleDateString('pt-BR'),
      fim: fim.toLocaleDateString('pt-BR')
    }
  }

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
        ) : erroChecklists ? (
          <div className="fade-in" style={{
            backgroundColor: '#fef2f2',
            borderRadius: '1rem',
            padding: '2rem',
            textAlign: 'center',
            border: '1px solid #fecaca'
          }}>
            <p style={{ color: '#dc2626', marginBottom: '1rem' }}>
              Não foi possível carregar os checklists. Verifique sua conexão.
            </p>
            <button
              onClick={() => { setErroChecklists(false); colaborador && carregarChecklists(colaborador.id) }}
              style={{ padding: '0.5rem 1.5rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}
            >
              Tentar novamente
            </button>
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
                        {(checklist.dias_tolerancia ?? 0) > 0 && checklist.proxima_execucao && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            🕐 {(() => { const j = calcularJanela(checklist.proxima_execucao, checklist.dias_tolerancia!); return `Disponível: ${j.inicio} – ${j.fim}` })()}
                          </div>
                        )}
                        {checklist.recorrencia && checklist.recorrencia !== 'nenhuma' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ padding: '0.15rem 0.5rem', backgroundColor: '#eff6ff', color: '#1d4ed8', borderRadius: '9999px', fontWeight: '600', fontSize: '0.75rem', border: '1px solid #bfdbfe' }}>
                              {labelRecorrencia[checklist.recorrencia] || checklist.recorrencia}
                            </span>
                          </div>
                        )}
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
                      {(checklist.recorrencia && checklist.recorrencia !== 'nenhuma') || (checklist.dias_tolerancia ?? 0) > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.8rem', color: '#6b7280' }}>
                          {checklist.recorrencia && checklist.recorrencia !== 'nenhuma' && (
                            <span style={{ padding: '0.15rem 0.5rem', backgroundColor: '#eff6ff', color: '#1d4ed8', borderRadius: '9999px', fontWeight: '600', border: '1px solid #bfdbfe' }}>
                              {labelRecorrencia[checklist.recorrencia] || checklist.recorrencia}
                            </span>
                          )}
                          {(checklist.dias_tolerancia ?? 0) > 0 && checklist.proxima_execucao && (
                            <span>
                              🕐 {(() => { const j = calcularJanela(checklist.proxima_execucao, checklist.dias_tolerancia!); return `${j.inicio} – ${j.fim}` })()}
                            </span>
                          )}
                        </div>
                      ) : null}
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

            {/* Atrasados */}
            {checklistsAtrasados.length > 0 && (
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
                  <AlertCircle size={20} style={{ color: '#ef4444' }} />
                  Atrasados ({checklistsAtrasados.length})
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                  {checklistsAtrasados.map(checklist => (
                    <div
                      key={checklist.id}
                      className="card"
                      onClick={() => responderChecklist(checklist.id)}
                      style={{
                        backgroundColor: 'white',
                        borderRadius: '1rem',
                        padding: '1.5rem',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                        border: '2px solid #fecaca'
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
                          backgroundColor: '#fee2e2',
                          color: '#991b1b'
                        }}>
                          Atrasado
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
                        {checklist.recorrencia && checklist.recorrencia !== 'nenhuma' && (
                          <span style={{ padding: '0.15rem 0.5rem', backgroundColor: '#eff6ff', color: '#1d4ed8', borderRadius: '9999px', fontWeight: '600', fontSize: '0.75rem', border: '1px solid #bfdbfe', alignSelf: 'flex-start' }}>
                            {labelRecorrencia[checklist.recorrencia] || checklist.recorrencia}
                          </span>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <ClipboardList size={14} />
                          {checklist.total_perguntas} perguntas
                        </div>
                      </div>
                      <div style={{
                        marginTop: '1rem',
                        padding: '0.75rem',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        borderRadius: '0.5rem',
                        textAlign: 'center',
                        fontWeight: '600',
                        fontSize: '0.95rem'
                      }}>
                        Responder Agora →
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

