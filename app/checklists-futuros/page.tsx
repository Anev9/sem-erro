'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Calendar, Clock, CheckCircle, AlertCircle, PlayCircle, Trash2, Pencil } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { calcularAlertaHorario } from '@/lib/prazo-horario'
import { inicioPeriodo } from '@/lib/periodo'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

type ChecklistFuturo = {
  id: string
  nome: string
  descricao: string | null
  tipo_negocio: string | null
  proxima_execucao: string | null
  status: string | null
  progresso_percentual: number | null
  departamento: string | null
  empresa_id: string | null
  total_itens?: number
  itens_respondidos?: number
  recorrencia?: string | null
  dias_tolerancia?: number | null
  prazo_alerta?: string | null
  hora_limite?: string | null
}

const statusInfo = {
  concluido: { tone: 'success' as const, icon: CheckCircle, label: 'Concluído' },
  em_andamento: { tone: 'info' as const, icon: PlayCircle, label: 'Em Andamento' },
  pendente: { tone: 'warning' as const, icon: Clock, label: 'Pendente' },
  atrasado: { tone: 'danger' as const, icon: AlertCircle, label: 'Atrasado' },
}

const labelRecorrencia: Record<string, string> = {
  diaria: '🔄 Diária',
  semanal: '🔄 Semanal',
  mensal: '🔄 Mensal'
}

export default function ChecklistsFuturosPage() {
  const router = useRouter()
  const [checklists, setChecklists] = useState<ChecklistFuturo[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<'admin' | 'aluno'>('aluno')
  const [userId, setUserId] = useState('')

  // Força recalcular os alertas de horário a cada minuto, sem precisar recarregar a página
  const [, setTick] = useState(0)
  useEffect(() => {
    const intervalo = setInterval(() => setTick(t => t + 1), 60000)
    return () => clearInterval(intervalo)
  }, [])

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
        .eq('aluno_id', Number(userId))
        .order('proxima_execucao', { ascending: true })

      if (error) {
        console.error('Erro ao buscar:', error)
        throw error
      }

      const checklistsFormatados = await Promise.all(
        (data || []).map(async (checklist) => {
          // Para checklists recorrentes, conta só as respostas do período atual
          // (dia/semana/mês); senão o progresso acumula respostas de dias
          // anteriores e passa de 100%.
          const periodoInicio = inicioPeriodo(checklist.recorrencia ?? null)

          let queryRespondidos = supabase
            .from('checklist_respostas')
            .select('*', { count: 'exact', head: true })
            .eq('checklist_futuro_id', checklist.id)

          if (periodoInicio) {
            queryRespondidos = queryRespondidos.gte('respondido_em', periodoInicio)
          }

          const { count: respondidos } = await queryRespondidos

          const totalItens = checklist.itens?.[0]?.count || 0
          const itensRespondidos = respondidos || 0

          let status = checklist.status || 'pendente'
          if (totalItens > 0 && itensRespondidos >= totalItens) {
            status = 'concluido'
          } else if (itensRespondidos > 0) {
            status = 'em_andamento'
          }

          const progresso_percentual = totalItens > 0
            ? Math.round((itensRespondidos / totalItens) * 100)
            : 0

          return {
            ...checklist,
            status,
            progresso_percentual,
            total_itens: totalItens,
            itens_respondidos: itensRespondidos,
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

      if (errorItens) throw new Error(`Itens: ${errorItens.message}`)

      // Excluir respostas
      const { error: errorRespostas } = await supabase
        .from('checklist_respostas')
        .delete()
        .eq('checklist_futuro_id', id)

      if (errorRespostas) throw new Error(`Respostas: ${errorRespostas.message}`)

      // Excluir checklist
      const { error: errorChecklist } = await supabase
        .from('checklists_futuros')
        .delete()
        .eq('id', id)

      if (errorChecklist) throw new Error(`Checklist: ${errorChecklist.message}`)

      toast.success('Checklist excluído com sucesso!')
      buscarChecklists(userRole === 'admin', userId)

    } catch (error: any) {
      console.error('Erro ao excluir:', error)
      toast.error(error?.message || 'Erro ao excluir checklist')
    }
  }

  function formatarData(data: string | null) {
    if (!data) return ''
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
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

  function obterAlertaPrazo(prazoAlerta: string | null | undefined): { nivel: 'vencido' | 'proximo' | null; diasRestantes: number } {
    if (!prazoAlerta) return { nivel: null, diasRestantes: 0 }
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const prazo = new Date(prazoAlerta)
    prazo.setHours(0, 0, 0, 0)
    const diff = Math.round((prazo.getTime() - hoje.getTime()) / 86400000)
    if (diff < 0) return { nivel: 'vencido', diasRestantes: diff }
    if (diff <= 3) return { nivel: 'proximo', diasRestantes: diff }
    return { nivel: null, diasRestantes: diff }
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1320px] px-6 py-8">

        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push(userRole === 'admin' ? '/dashboard-admin' : '/dashboard-aluno')}
            className="mb-4 inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-sm font-medium text-ink-muted shadow-soft-sm transition-colors hover:text-ink cursor-pointer"
          >
            <ArrowLeft size={16} />
            Voltar para Dashboard
          </button>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-ink">Checklists Futuros</h1>
              <p className="mt-1 text-sm text-ink-muted">Gerencie os checklists que você criou</p>
            </div>

            <Button variant="primary" onClick={() => router.push('/checklists-futuros/criar')} icon={<Plus size={18} />}>
              Criar Novo Checklist
            </Button>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <Card className="p-16 text-center">
            <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-4 border-surface-2 border-t-brand" />
            <p className="text-sm text-ink-muted">Carregando checklists...</p>
          </Card>
        ) : checklists.length === 0 ? (
          /* Vazio */
          <Card className="px-6 py-16 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-tint">
              <Calendar size={36} className="text-brand" />
            </div>
            <h3 className="font-display text-xl font-bold text-ink">Nenhum checklist criado</h3>
            <p className="mt-2 mb-6 text-sm text-ink-muted">Comece criando seu primeiro checklist futuro</p>
            <Button variant="primary" onClick={() => router.push('/checklists-futuros/criar')} icon={<Plus size={18} />}>
              Criar Primeiro Checklist
            </Button>
          </Card>
        ) : (
          /* Lista de Checklists */
          <div className="flex flex-col gap-4">
            {checklists.map((checklist) => {
              const info = statusInfo[(checklist.status || 'pendente') as keyof typeof statusInfo] || statusInfo.pendente
              const StatusIcon = info.icon
              const progresso = checklist.progresso_percentual || 0
              const alertaPrazo = obterAlertaPrazo(checklist.prazo_alerta)
              const alertaHorario = checklist.status !== 'concluido' ? calcularAlertaHorario(checklist.hora_limite) : null

              return (
                <Card key={checklist.id} className="p-6">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-ink">{checklist.nome}</h3>
                      {checklist.descricao && (
                        <p className="mt-1 text-sm leading-relaxed text-ink-muted">{checklist.descricao}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {alertaPrazo.nivel === 'vencido' && (
                        <Badge tone="danger">⚠️ Prazo vencido</Badge>
                      )}
                      {alertaPrazo.nivel === 'proximo' && (
                        <Badge tone="warning">⏰ Vence em {alertaPrazo.diasRestantes === 0 ? 'hoje' : `${alertaPrazo.diasRestantes}d`}</Badge>
                      )}
                      {alertaHorario?.nivel === 'vencido' && (
                        <Badge tone="danger">⏰ Prazo de hoje vencido ({alertaHorario.horaFormatada})</Badge>
                      )}
                      {alertaHorario?.nivel === 'proximo' && (
                        <Badge tone="warning">⏰ Prazo em {alertaHorario.minutosRestantes} min ({alertaHorario.horaFormatada})</Badge>
                      )}
                      <Badge tone={info.tone}>
                        <StatusIcon size={13} />
                        {info.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Barra de Progresso */}
                  <div className="mb-4">
                    <div className="mb-1.5 flex justify-between text-sm">
                      <span className="text-ink-muted">Progresso</span>
                      <span className="font-semibold text-ink">
                        {checklist.itens_respondidos || 0} / {checklist.total_itens || 0} itens ({progresso}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                      <div
                        className={`h-full rounded-full transition-[width] duration-300 ${progresso === 100 ? 'bg-teal' : 'bg-brand'}`}
                        style={{ width: `${progresso}%` }}
                      />
                    </div>
                  </div>

                  {/* Informações */}
                  <div className="mb-4 flex flex-wrap gap-4 text-sm text-ink-muted">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={15} />
                      {formatarData(checklist.proxima_execucao)}
                    </div>
                    {checklist.tipo_negocio && <div>📋 {checklist.tipo_negocio}</div>}
                    {checklist.departamento && <div>🏢 {checklist.departamento}</div>}
                    {checklist.recorrencia && checklist.recorrencia !== 'nenhuma' && (
                      <Badge tone="info">{labelRecorrencia[checklist.recorrencia] || checklist.recorrencia}</Badge>
                    )}
                    {(checklist.dias_tolerancia ?? 0) > 0 && (
                      <span className="flex items-center gap-1">
                        🕐 Janela: {(() => {
                          const j = calcularJanela(checklist.proxima_execucao ?? '', checklist.dias_tolerancia!)
                          return `${j.inicio} – ${j.fim}`
                        })()}
                      </span>
                    )}
                    {checklist.hora_limite && (
                      <span className="flex items-center gap-1">⏰ Até {checklist.hora_limite.slice(0, 5)}</span>
                    )}
                  </div>

                  {/* Botões */}
                  <div className="flex flex-wrap gap-2.5">
                    <Button variant="primary" onClick={() => router.push(`/checklists-futuros/${checklist.id}`)}>
                      Ver Detalhes
                    </Button>
                    <Button variant="secondary" onClick={() => router.push(`/checklists-futuros/editar/${checklist.id}`)} icon={<Pencil size={16} />}>
                      Editar
                    </Button>
                    <Button variant="danger" onClick={() => excluirChecklist(checklist.id, checklist.nome)} icon={<Trash2 size={16} />}>
                      Excluir
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
