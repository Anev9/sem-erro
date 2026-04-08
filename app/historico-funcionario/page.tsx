'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle, Clock, Building2, Search, Calendar } from 'lucide-react'

interface ChecklistHistorico {
  id: string
  nome: string
  status: string
  proxima_execucao: string | null
  updated_at: string
  recorrencia: string | null
  total_perguntas: number
  respostas_count: number
  empresas?: { nome_fantasia: string }
}

export default function HistoricoFuncionario() {
  const router = useRouter()
  const [checklists, setChecklists] = useState<ChecklistHistorico[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'concluido' | 'pendente'>('todos')
  const [colaboradorId, setColaboradorId] = useState<string | null>(null)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) { router.push('/login'); return }
    const user = JSON.parse(userStr)
    const id = user.id || user.colaborador_id
    if (!id) { router.push('/login'); return }
    setColaboradorId(id)
    carregarHistorico(id)
  }, [router])

  async function carregarHistorico(id: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/colaborador/checklists?colaborador_id=${id}`)
      if (!res.ok) return
      const data = await res.json()
      setChecklists(data || [])
    } catch {
      // silencioso
    } finally {
      setLoading(false)
    }
  }

  const listaFiltrada = checklists
    .filter(cl => {
      const concluido = cl.respostas_count > 0 && cl.respostas_count >= cl.total_perguntas
      if (filtroStatus === 'concluido' && !concluido) return false
      if (filtroStatus === 'pendente' && concluido) return false
      if (busca.trim()) {
        const q = busca.toLowerCase()
        return cl.nome.toLowerCase().includes(q) || (cl.empresas?.nome_fantasia || '').toLowerCase().includes(q)
      }
      return true
    })
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

  function formatarData(data: string | null) {
    if (!data) return '—'
    return new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  function getRecorrenciaLabel(r: string | null) {
    const map: Record<string, string> = { diaria: 'Diária', semanal: 'Semanal', mensal: 'Mensal', quinzenal: 'Quinzenal' }
    return r ? (map[r] || r) : '—'
  }

  const totalConcluidos = checklists.filter(cl => cl.respostas_count >= cl.total_perguntas && cl.total_perguntas > 0).length
  const totalPendentes = checklists.length - totalConcluidos

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <nav style={{ backgroundColor: '#334155', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', height: '4rem', gap: '1rem' }}>
          <button
            onClick={() => router.push('/dashboard-funcionario')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 0.875rem', color: 'white', cursor: 'pointer', fontSize: '0.875rem' }}
          >
            <ArrowLeft size={16} /> Voltar
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <Clock size={18} style={{ color: '#93c5fd' }} />
            <span style={{ color: 'white', fontWeight: '700', fontSize: '1.1rem' }}>Histórico de Checklists</span>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Cards resumo */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Total', value: checklists.length, color: '#3b82f6', bg: '#eff6ff', icon: '📋' },
            { label: 'Concluídos', value: totalConcluidos, color: '#10b981', bg: '#f0fdf4', icon: '✅' },
            { label: 'Pendentes', value: totalPendentes, color: '#f59e0b', bg: '#fffbeb', icon: '⏳' },
          ].map(card => (
            <div key={card.label} style={{ background: card.bg, borderRadius: '0.75rem', padding: '1rem 1.25rem', border: `1px solid ${card.color}25` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.25rem' }}>
                <span>{card.icon}</span>
                <span style={{ fontSize: '0.75rem', color: card.color, fontWeight: '600' }}>{card.label}</span>
              </div>
              <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: '800', color: card.color }}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div style={{ background: 'white', borderRadius: '1rem', padding: '1rem 1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
            <Search size={14} style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Buscar checklist ou empresa..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              style={{ width: '100%', paddingLeft: '2rem', paddingRight: '0.75rem', paddingTop: '0.5rem', paddingBottom: '0.5rem', border: '1.5px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '0.375rem', padding: '2px', gap: '2px' }}>
            {(['todos', 'concluido', 'pendente'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFiltroStatus(f)}
                style={{ padding: '0.3rem 0.75rem', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', background: filtroStatus === f ? 'white' : 'transparent', color: filtroStatus === f ? '#334155' : '#6b7280', boxShadow: filtroStatus === f ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}
              >
                {f === 'todos' ? 'Todos' : f === 'concluido' ? 'Concluídos' : 'Pendentes'}
              </button>
            ))}
          </div>
        </div>

        {/* Lista */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid #f3f4f6', borderTopColor: '#334155', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
            Carregando histórico...
          </div>
        ) : listaFiltrada.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af', background: 'white', borderRadius: '1rem' }}>
            <Clock size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
            <p>Nenhum checklist encontrado</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {listaFiltrada.map(cl => {
              const concluido = cl.total_perguntas > 0 && cl.respostas_count >= cl.total_perguntas
              const pct = cl.total_perguntas > 0 ? Math.round((cl.respostas_count / cl.total_perguntas) * 100) : 0

              return (
                <div
                  key={cl.id}
                  onClick={() => router.push(`/responder-checklist/${cl.id}`)}
                  style={{ background: 'white', borderRadius: '0.75rem', padding: '1.125rem 1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', cursor: 'pointer', border: `2px solid ${concluido ? '#d1fae5' : '#e5e7eb'}`, transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = concluido ? '#10b981' : '#3b82f6'; e.currentTarget.style.transform = 'translateX(3px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = concluido ? '#d1fae5' : '#e5e7eb'; e.currentTarget.style.transform = 'translateX(0)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                        {concluido
                          ? <CheckCircle size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                          : <Clock size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
                        }
                        <span style={{ fontWeight: '700', color: '#1f2937', fontSize: '0.9rem' }}>{cl.nome}</span>
                        <span style={{ padding: '0.125rem 0.5rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: '700', background: concluido ? '#d1fae5' : '#fef3c7', color: concluido ? '#059669' : '#d97706' }}>
                          {concluido ? 'Concluído' : 'Pendente'}
                        </span>
                        {cl.recorrencia && (
                          <span style={{ padding: '0.125rem 0.5rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: '600', background: '#eff6ff', color: '#1d4ed8' }}>
                            {getRecorrenciaLabel(cl.recorrencia)}
                          </span>
                        )}
                      </div>
                      {cl.empresas && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#6b7280', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                          <Building2 size={13} />
                          {cl.empresas.nome_fantasia}
                        </div>
                      )}
                      {/* Barra de progresso */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <div style={{ flex: 1, height: '6px', borderRadius: '999px', background: '#f1f5f9', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: concluido ? '#10b981' : '#3b82f6', borderRadius: '999px', transition: 'width 0.3s ease' }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#6b7280', flexShrink: 0 }}>{cl.respostas_count}/{cl.total_perguntas}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#9ca3af', fontSize: '0.75rem', justifyContent: 'flex-end' }}>
                        <Calendar size={12} />
                        {formatarData(cl.updated_at)}
                      </div>
                      {cl.proxima_execucao && (
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                          Próxima: {formatarData(cl.proxima_execucao)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.75rem', marginTop: '1rem' }}>
          {listaFiltrada.length} checklist{listaFiltrada.length !== 1 ? 's' : ''} exibido{listaFiltrada.length !== 1 ? 's' : ''}
        </p>
      </main>
    </div>
  )
}
