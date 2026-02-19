'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  MinusCircle,
  Building2,
  User,
  Calendar,
  ClipboardList,
  AlertTriangle
} from 'lucide-react'

interface Checklist {
  id: string
  titulo: string
  descricao?: string
  status: string
  data_inicio: string
  data_fim: string
  created_at: string
  empresas?: { nome_fantasia: string }
  colaboradores?: { nome: string }
}

interface Item {
  id: string
  titulo: string
  descricao?: string
  ordem: number
}

interface Resposta {
  item_id: string
  resposta: 'sim' | 'nao' | 'na' | null
  observacao?: string
}

interface AcaoVinculada {
  id: string
  titulo: string
  status: string
  prioridade: string
  responsavel?: string
  prazo?: string
  item_id?: string
}

export default function DetalhesChecklistPage() {
  const router = useRouter()
  const params = useParams()
  const checklistId = params.id as string

  const [checklist, setChecklist] = useState<Checklist | null>(null)
  const [itens, setItens] = useState<Item[]>([])
  const [respostas, setRespostas] = useState<Record<string, Resposta>>({})
  const [acoes, setAcoes] = useState<AcaoVinculada[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    verificarAutenticacao()
  }, [checklistId])

  async function verificarAutenticacao() {
    const userStr = localStorage.getItem('user')
    if (!userStr) { router.push('/login'); return }
    const user = JSON.parse(userStr)
    if (user.role !== 'aluno') { router.push('/login'); return }
    await carregarDados(user.id)
  }

  async function carregarDados(alunoId: string) {
    try {
      setLoading(true)

      const res = await fetch(`/api/aluno/checklists-criados/${checklistId}?aluno_id=${alunoId}`)
      if (!res.ok) {
        alert('Checklist não encontrado.')
        router.push('/checklists-criados')
        return
      }

      const { checklist: cl, itens: it, respostas: resp, acoes: ac } = await res.json()

      setChecklist(cl)
      setItens(it || [])

      const mapaRespostas: Record<string, Resposta> = {}
      ;(resp || []).forEach((r: any) => {
        mapaRespostas[r.item_id] = {
          item_id: r.item_id,
          resposta: r.resposta,
          observacao: r.observacao || ''
        }
      })
      setRespostas(mapaRespostas)
      setAcoes(ac || [])

    } catch (err) {
      console.error('Erro ao carregar detalhes:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'white', fontSize: '1rem' }}>Carregando detalhes...</p>
      </div>
    )
  }

  if (!checklist) return null

  const totalItens = itens.length
  const conformes = itens.filter(i => respostas[i.id]?.resposta === 'sim').length
  const naoConformes = itens.filter(i => respostas[i.id]?.resposta === 'nao').length
  const naAplicavel = itens.filter(i => respostas[i.id]?.resposta === 'na').length
  const semResposta = itens.filter(i => !respostas[i.id]?.resposta).length
  const respondidos = totalItens - semResposta
  const percentual = totalItens > 0 ? Math.round((conformes / (totalItens - naAplicavel || 1)) * 100) : 0

  const getStatusChecklist = (status: string) => {
    const s = { pendente: { bg: '#FFF3E0', text: '#E65100', border: '#FFB74D', label: 'Pendente' }, em_andamento: { bg: '#E3F2FD', text: '#1565C0', border: '#64B5F6', label: 'Em Andamento' }, concluido: { bg: '#E8F5E9', text: '#2E7D32', border: '#81C784', label: 'Concluído' } }
    return s[status as keyof typeof s] || s.pendente
  }

  const getStatusAcao = (status: string) => {
    const s = { aguardando: { bg: '#FFF3E0', text: '#E65100', label: 'Aguardando' }, em_andamento: { bg: '#E3F2FD', text: '#1565C0', label: 'Em Andamento' }, concluida: { bg: '#E8F5E9', text: '#2E7D32', label: 'Concluída' }, atrasada: { bg: '#FFEBEE', text: '#C62828', label: 'Atrasada' } }
    return s[status as keyof typeof s] || s.aguardando
  }

  const getPrioridadeCor = (p: string) => ({ baixa: '#4CAF50', media: '#FF9800', alta: '#ef5350' }[p] || '#FF9800')

  const formatarData = (d: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '—'

  const statusCl = getStatusChecklist(checklist.status)

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.4s ease-out; }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '1.5rem 2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <button
              onClick={() => router.push('/checklists-criados')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.85)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '1rem', padding: 0 }}
            >
              <ArrowLeft size={16} />
              Voltar para Checklists
            </button>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'white', margin: '0 0 0.5rem' }}>
                  {checklist.titulo}
                </h1>
                <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                  {checklist.empresas && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.85)' }}>
                      <Building2 size={14} /> {checklist.empresas.nome_fantasia}
                    </span>
                  )}
                  {checklist.colaboradores && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.85)' }}>
                      <User size={14} /> {checklist.colaboradores.nome}
                    </span>
                  )}
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.85)' }}>
                    <Calendar size={14} /> Prazo: {formatarData(checklist.data_fim)}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.85)' }}>
                    <ClipboardList size={14} /> {respondidos}/{totalItens} respondidos
                  </span>
                </div>
              </div>
              <span style={{ padding: '0.375rem 1rem', background: statusCl.bg, color: statusCl.text, border: `1.5px solid ${statusCl.border}`, borderRadius: '999px', fontSize: '0.8rem', fontWeight: '700', whiteSpace: 'nowrap' }}>
                {statusCl.label}
              </span>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>

          {/* Cards de resumo */}
          <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '2px solid #bbf7d0' }}>
              <p style={{ fontSize: '2.25rem', fontWeight: '800', color: '#16a34a', margin: 0 }}>{conformes}</p>
              <p style={{ fontSize: '0.8rem', color: '#15803d', fontWeight: '600', margin: '0.25rem 0 0' }}>Conforme</p>
            </div>
            <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '2px solid #fecaca' }}>
              <p style={{ fontSize: '2.25rem', fontWeight: '800', color: '#dc2626', margin: 0 }}>{naoConformes}</p>
              <p style={{ fontSize: '0.8rem', color: '#b91c1c', fontWeight: '600', margin: '0.25rem 0 0' }}>Não Conforme</p>
            </div>
            <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '2px solid #e5e7eb' }}>
              <p style={{ fontSize: '2.25rem', fontWeight: '800', color: '#6b7280', margin: 0 }}>{naAplicavel}</p>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: '600', margin: '0.25rem 0 0' }}>N/A</p>
            </div>
            {semResposta > 0 && (
              <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '2px solid #fed7aa' }}>
                <p style={{ fontSize: '2.25rem', fontWeight: '800', color: '#ea580c', margin: 0 }}>{semResposta}</p>
                <p style={{ fontSize: '0.8rem', color: '#c2410c', fontWeight: '600', margin: '0.25rem 0 0' }}>Sem Resposta</p>
              </div>
            )}
            <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '12px', padding: '1.25rem', textAlign: 'center', boxShadow: '0 4px 12px rgba(102,126,234,0.3)' }}>
              <p style={{ fontSize: '2.25rem', fontWeight: '800', color: 'white', margin: 0 }}>{percentual}%</p>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)', fontWeight: '600', margin: '0.25rem 0 0' }}>Conformidade</p>
            </div>
          </div>

          {/* Barra de progresso */}
          <div className="fade-in" style={{ background: 'white', borderRadius: '12px', padding: '1.25rem 1.5rem', marginBottom: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#64748b', fontWeight: '600' }}>
              <span>Conformidade geral</span>
              <span style={{ color: percentual >= 80 ? '#16a34a' : percentual >= 50 ? '#ca8a04' : '#dc2626' }}>{percentual}%</span>
            </div>
            <div style={{ width: '100%', height: '10px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{
                width: `${percentual}%`, height: '100%', borderRadius: '999px', transition: 'width 0.6s ease',
                background: percentual >= 80 ? '#16a34a' : percentual >= 50 ? '#ca8a04' : '#dc2626'
              }} />
            </div>
          </div>

          {/* Lista de itens */}
          <div className="fade-in" style={{ background: 'white', borderRadius: '16px', padding: '1.75rem', marginBottom: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#1e293b', margin: '0 0 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ClipboardList size={20} style={{ color: '#667eea' }} />
              Itens do Checklist
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {itens.map((item, index) => {
                const r = respostas[item.id]
                const acaoItem = acoes.find(a => a.item_id === item.id)

                const corFundo = r?.resposta === 'sim' ? '#f0fdf4' : r?.resposta === 'nao' ? '#fef2f2' : r?.resposta === 'na' ? '#f9fafb' : '#fffbeb'
                const corBorda = r?.resposta === 'sim' ? '#bbf7d0' : r?.resposta === 'nao' ? '#fecaca' : r?.resposta === 'na' ? '#e5e7eb' : '#fed7aa'

                return (
                  <div key={item.id} style={{ background: corFundo, border: `1.5px solid ${corBorda}`, borderRadius: '10px', padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
                      {/* Ícone de resposta */}
                      <div style={{ flexShrink: 0, marginTop: '2px' }}>
                        {r?.resposta === 'sim' ? <CheckCircle size={20} style={{ color: '#16a34a' }} /> :
                         r?.resposta === 'nao' ? <XCircle size={20} style={{ color: '#dc2626' }} /> :
                         r?.resposta === 'na' ? <MinusCircle size={20} style={{ color: '#9ca3af' }} /> :
                         <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid #fb923c', background: 'white' }} />}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>{index + 1}.</span>
                          <p style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: '500', margin: 0 }}>{item.titulo}</p>
                        </div>

                        {r?.observacao && (
                          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.375rem 0 0', fontStyle: 'italic', paddingLeft: '1rem', borderLeft: '2px solid #cbd5e1' }}>
                            {r.observacao}
                          </p>
                        )}

                        {/* Ação vinculada a este item */}
                        {acaoItem && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.5rem', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '6px', padding: '0.25rem 0.625rem', fontSize: '0.75rem', color: '#ea580c' }}>
                            <AlertTriangle size={12} />
                            Ação: {acaoItem.titulo}
                          </div>
                        )}
                      </div>

                      {/* Label da resposta */}
                      <div style={{ flexShrink: 0 }}>
                        <span style={{
                          fontSize: '0.8rem', fontWeight: '700', padding: '0.25rem 0.75rem', borderRadius: '999px',
                          background: r?.resposta === 'sim' ? '#dcfce7' : r?.resposta === 'nao' ? '#fee2e2' : r?.resposta === 'na' ? '#f3f4f6' : '#ffedd5',
                          color: r?.resposta === 'sim' ? '#16a34a' : r?.resposta === 'nao' ? '#dc2626' : r?.resposta === 'na' ? '#6b7280' : '#ea580c'
                        }}>
                          {r?.resposta === 'sim' ? 'Sim' : r?.resposta === 'nao' ? 'Não' : r?.resposta === 'na' ? 'N/A' : 'Pendente'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Ações corretivas vinculadas */}
          {acoes.length > 0 && (
            <div className="fade-in" style={{ background: 'white', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#1e293b', margin: '0 0 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={20} style={{ color: '#ea580c' }} />
                Ações Corretivas ({acoes.length})
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {acoes.map(acao => {
                  const statusAcao = getStatusAcao(acao.status)
                  return (
                    <div key={acao.id} style={{ border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '200px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: getPrioridadeCor(acao.prioridade), flexShrink: 0 }} title={`Prioridade ${acao.prioridade}`} />
                        <div>
                          <p style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1e293b', margin: 0 }}>{acao.titulo}</p>
                          {acao.responsavel && (
                            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0 0' }}>Responsável: {acao.responsavel}</p>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        {acao.prazo && (
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            Prazo: {formatarData(acao.prazo)}
                          </span>
                        )}
                        <span style={{ padding: '0.25rem 0.75rem', background: statusAcao.bg, color: statusAcao.text, borderRadius: '999px', fontSize: '0.75rem', fontWeight: '700' }}>
                          {statusAcao.label}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              <button
                onClick={() => router.push('/acoes')}
                style={{ marginTop: '1.25rem', padding: '0.75rem 1.5rem', background: 'transparent', color: '#667eea', border: '2px solid #667eea', borderRadius: '10px', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#667eea'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#667eea'; }}
              >
                Ver todas as ações
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  )
}
