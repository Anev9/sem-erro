'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Clock, Building2, Search, Calendar, ClipboardList } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

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
    <div className="min-h-screen">
      <div className="mx-auto max-w-[900px] px-6 py-8">
        <PageHeader title="Histórico de Checklists" backHref="/dashboard-funcionario" />

        {/* Cards resumo */}
        <div className="mb-5 grid grid-cols-3 gap-3">
          <Card className="p-4">
            <div className="mb-1 flex items-center gap-1.5">
              <ClipboardList size={14} className="text-blue" />
              <span className="text-xs font-semibold text-blue">Total</span>
            </div>
            <p className="font-display text-2xl font-bold text-blue">{checklists.length}</p>
          </Card>
          <Card className="p-4">
            <div className="mb-1 flex items-center gap-1.5">
              <CheckCircle size={14} className="text-teal" />
              <span className="text-xs font-semibold text-teal">Concluídos</span>
            </div>
            <p className="font-display text-2xl font-bold text-teal">{totalConcluidos}</p>
          </Card>
          <Card className="p-4">
            <div className="mb-1 flex items-center gap-1.5">
              <Clock size={14} className="text-amber" />
              <span className="text-xs font-semibold text-amber">Pendentes</span>
            </div>
            <p className="font-display text-2xl font-bold text-amber">{totalPendentes}</p>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-5 flex flex-wrap items-center gap-3 p-4">
          <div className="relative min-w-[180px] flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              type="text"
              placeholder="Buscar checklist ou empresa..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full rounded-xl bg-surface-2 py-2.5 pl-9 pr-3 text-sm outline-none"
            />
          </div>
          <div className="flex gap-1 rounded-xl bg-surface-2 p-1">
            {(['todos', 'concluido', 'pendente'] as const).map(f => (
              <Button key={f} variant={filtroStatus === f ? 'primary' : 'ghost'} size="sm" onClick={() => setFiltroStatus(f)}>
                {f === 'todos' ? 'Todos' : f === 'concluido' ? 'Concluídos' : 'Pendentes'}
              </Button>
            ))}
          </div>
        </Card>

        {/* Lista */}
        {loading ? (
          <div className="py-16 text-center text-sm text-ink-muted">
            <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-surface-2 border-t-brand" />
            Carregando histórico...
          </div>
        ) : listaFiltrada.length === 0 ? (
          <Card className="px-6 py-16 text-center">
            <Clock size={40} className="mx-auto mb-4 text-ink-faint" />
            <p className="text-sm text-ink-muted">Nenhum checklist encontrado</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-2.5">
            {listaFiltrada.map(cl => {
              const concluido = cl.total_perguntas > 0 && cl.respostas_count >= cl.total_perguntas
              const pct = cl.total_perguntas > 0 ? Math.round((cl.respostas_count / cl.total_perguntas) * 100) : 0

              return (
                <Card
                  key={cl.id}
                  interactive
                  onClick={() => router.push(`/responder-checklist/${cl.id}`)}
                  className="p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        {concluido ? <CheckCircle size={16} className="flex-shrink-0 text-teal" /> : <Clock size={16} className="flex-shrink-0 text-amber" />}
                        <span className="text-sm font-bold text-ink">{cl.nome}</span>
                        <Badge tone={concluido ? 'success' : 'warning'}>{concluido ? 'Concluído' : 'Pendente'}</Badge>
                        {cl.recorrencia && <Badge tone="info">{getRecorrenciaLabel(cl.recorrencia)}</Badge>}
                      </div>
                      {cl.empresas && (
                        <div className="mb-2 flex items-center gap-1.5 text-xs text-ink-muted">
                          <Building2 size={13} />
                          {cl.empresas.nome_fantasia}
                        </div>
                      )}
                      {/* Barra de progresso */}
                      <div className="flex items-center gap-2.5">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                          <div
                            className={`h-full rounded-full transition-[width] duration-300 ${concluido ? 'bg-teal' : 'bg-blue'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="flex-shrink-0 text-xs text-ink-faint">{cl.respostas_count}/{cl.total_perguntas}</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="flex items-center justify-end gap-1 text-xs text-ink-faint">
                        <Calendar size={12} />
                        {formatarData(cl.updated_at)}
                      </div>
                      {cl.proxima_execucao && (
                        <p className="mt-1 text-xs text-ink-muted">Próxima: {formatarData(cl.proxima_execucao)}</p>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        <p className="mt-4 text-center text-xs text-ink-faint">
          {listaFiltrada.length} checklist{listaFiltrada.length !== 1 ? 's' : ''} exibido{listaFiltrada.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  )
}

