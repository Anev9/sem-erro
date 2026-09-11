'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Calendar, CheckCircle, XCircle, MinusCircle, Clock, AlertCircle, PlayCircle, ClipboardList, Building2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { diaBrasil, hojeBrasil } from '@/lib/periodo'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

interface ChecklistFuturo {
  id: string
  nome: string
  descricao?: string | null
  proxima_execucao?: string | null
  status: string
  tipo_negocio?: string | null
  departamento?: string | null
  recorrencia?: string | null
  dias_tolerancia?: number | null
  aluno_id: number | null
  empresa_id?: string | null
  colaborador_id?: string | null
  data_inicio?: string | null
  data_fim?: string | null
  empresas?: { nome_fantasia: string } | null
  colaboradores?: { nome: string; cargo?: string | null } | null
}

interface Item {
  id: string
  titulo: string
  descricao?: string | null
  ordem: number
}

interface Resposta {
  item_id: string
  resposta: 'sim' | 'nao' | 'na' | null
  observacao?: string | null
  foto_url?: string | null
  respondido_em?: string | null
}

const statusInfo = {
  concluido: { tone: 'success' as const, icon: CheckCircle, label: 'Concluído' },
  em_andamento: { tone: 'info' as const, icon: PlayCircle, label: 'Em Andamento' },
  pendente: { tone: 'warning' as const, icon: Clock, label: 'Pendente' },
  atrasado: { tone: 'danger' as const, icon: AlertCircle, label: 'Atrasado' },
}

const respostaEstilo = {
  sim: { bg: 'bg-teal-tint', text: 'text-teal', label: 'Sim', icon: <CheckCircle size={18} className="text-teal" /> },
  nao: { bg: 'bg-coral-tint', text: 'text-coral', label: 'Não', icon: <XCircle size={18} className="text-coral" /> },
  na: { bg: 'bg-surface-2', text: 'text-ink-faint', label: 'N/A', icon: <MinusCircle size={18} className="text-ink-faint" /> },
  semResposta: { bg: 'bg-surface-2', text: 'text-ink-faint', label: 'Sem resposta', icon: null },
}

export default function DetalhesChecklistFuturoPage() {
  const router = useRouter()
  const params = useParams()
  const checklistId = params.id as string

  const [checklist, setChecklist] = useState<ChecklistFuturo | null>(null)
  const [itens, setItens] = useState<Item[]>([])
  const [respostasTodas, setRespostasTodas] = useState<Resposta[]>([])
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [fotoExpandida, setFotoExpandida] = useState<string | null>(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }

    const user = JSON.parse(userData)

    // Somente aluno ou admin
    if (user.role !== 'admin' && user.role !== 'aluno') {
      router.push('/meus-checklists')
      return
    }

    carregarDados(user.id)
  }, [router, checklistId])

  async function carregarDados(userId: string) {
    try {
      setLoading(true)

      // Buscar checklist — só carrega se pertencer ao aluno logado
      const { data: checklistData, error: checklistError } = await supabase
        .from('checklists_futuros')
        .select(`
          *,
          empresas ( nome_fantasia ),
          colaboradores ( nome, cargo )
        `)
        .eq('id', checklistId)
        .eq('aluno_id', Number(userId))
        .single()

      if (checklistError || !checklistData) {
        toast.error('Checklist não encontrado ou sem permissão de acesso.')
        router.push('/checklists-futuros')
        return
      }

      setChecklist(checklistData as unknown as ChecklistFuturo)

      // Buscar itens
      const { data: itensData, error: itensError } = await supabase
        .from('checklist_futuro_itens')
        .select('*')
        .eq('checklist_futuro_id', checklistId)
        .order('ordem')

      if (itensError) throw itensError

      const listaItens: Item[] = (itensData || []) as unknown as Item[]
      setItens(listaItens)

      // Buscar respostas do funcionário (se houver) — todo o histórico,
      // para permitir navegar dia a dia em checklists recorrentes
      const { data: respostasData } = await supabase
        .from('checklist_respostas')
        .select('*')
        .eq('checklist_futuro_id', checklistId)
        .order('respondido_em', { ascending: true })

      const listaRespostas: Resposta[] = (respostasData || []).map((r: any) => ({
        item_id: r.item_id,
        resposta: r.resposta,
        observacao: r.observacao,
        foto_url: r.foto_url,
        respondido_em: r.respondido_em
      }))
      setRespostasTodas(listaRespostas)

      // Para checklists recorrentes, seleciona por padrão o dia mais recente com respostas
      const ehRecorrente = checklistData.recorrencia && checklistData.recorrencia !== 'nenhuma'
      if (ehRecorrente) {
        const dias = Array.from(new Set(listaRespostas.map(r => diaBrasil(r.respondido_em)).filter(Boolean))) as string[]
        dias.sort().reverse()
        setDiaSelecionado(dias[0] || hojeBrasil())
      }
    } catch (error) {
      console.error('Erro ao carregar checklist:', error)
      toast.error('Erro ao carregar checklist.')
    } finally {
      setLoading(false)
    }
  }

  const ehRecorrente = !!(checklist?.recorrencia && checklist.recorrencia !== 'nenhuma')

  // Dias com respostas registradas, do mais recente para o mais antigo
  const diasDisponiveis = Array.from(
    new Set(respostasTodas.map(r => diaBrasil(r.respondido_em)).filter(Boolean))
  ).sort().reverse() as string[]

  // Respostas do dia selecionado (ou todas, se o checklist não for recorrente)
  const respostasDoDia = ehRecorrente
    ? respostasTodas.filter(r => diaBrasil(r.respondido_em) === diaSelecionado)
    : respostasTodas

  const respostas: Record<string, Resposta> = {}
  respostasDoDia.forEach(r => { respostas[r.item_id] = r })

  const totalRespondidos = Object.values(respostas).filter(r => r.resposta !== null).length
  const conformes = Object.values(respostas).filter(r => r.resposta === 'sim').length
  const naoConformes = Object.values(respostas).filter(r => r.resposta === 'nao').length
  const naAplicavel = Object.values(respostas).filter(r => r.resposta === 'na').length

  function formatarDia(dia: string) {
    const [ano, mes, diaNum] = dia.split('-')
    const label = `${diaNum}/${mes}/${ano}`
    return dia === hojeBrasil() ? `Hoje (${diaNum}/${mes})` : label
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-ink-muted">Carregando...</p>
      </div>
    )
  }

  if (!checklist) return null

  const info = statusInfo[(checklist.status || 'pendente') as keyof typeof statusInfo] || statusInfo.pendente
  const StatusIcon = info.icon

  return (
    <>
      {fotoExpandida && (
        <div
          onClick={() => setFotoExpandida(null)}
          className="fixed inset-0 z-[9999] flex cursor-zoom-out items-center justify-center bg-black/85 p-4"
        >
          <img src={fotoExpandida} alt="Foto ampliada" className="max-h-[90vh] max-w-full rounded-xl object-contain" />
        </div>
      )}

      <div className="min-h-screen">
        <div className="mx-auto max-w-[860px] px-6 py-8">

          <button
            onClick={() => router.push('/checklists-futuros')}
            className="mb-5 inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-sm font-medium text-ink-muted shadow-soft-sm transition-colors hover:text-ink cursor-pointer"
          >
            <ArrowLeft size={16} />
            Voltar
          </button>

          {/* Header */}
          <Card className="mb-5 p-6">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="font-display text-xl font-bold text-ink">{checklist.nome}</h1>
                {checklist.descricao && <p className="mt-1 text-sm text-ink-muted">{checklist.descricao}</p>}
              </div>
              <Badge tone={info.tone}>
                <StatusIcon size={14} />
                {info.label}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-ink-muted">
              {checklist.proxima_execucao && (
                <div className="flex items-center gap-1.5">
                  <Calendar size={15} />
                  {new Date(checklist.proxima_execucao).toLocaleDateString('pt-BR')}
                </div>
              )}
              {checklist.empresas && (
                <div className="flex items-center gap-1.5">
                  <Building2 size={15} />
                  {checklist.empresas.nome_fantasia}
                </div>
              )}
              {checklist.colaboradores && (
                <div className="flex items-center gap-1.5">
                  <ClipboardList size={15} />
                  {checklist.colaboradores.nome}
                  {checklist.colaboradores.cargo && ` — ${checklist.colaboradores.cargo}`}
                </div>
              )}
              {checklist.recorrencia && checklist.recorrencia !== 'nenhuma' && (
                <Badge tone="info">🔄 {checklist.recorrencia.charAt(0).toUpperCase() + checklist.recorrencia.slice(1)}</Badge>
              )}
              {(checklist.dias_tolerancia ?? 0) > 0 && (
                <span>🕐 {checklist.dias_tolerancia} dia(s) de tolerância</span>
              )}
            </div>
          </Card>

          {/* Seletor de dia (checklists recorrentes) */}
          {ehRecorrente && (
            <Card className="mb-5 p-5">
              <p className="mb-3 text-sm font-semibold text-ink-muted">Ver histórico do dia</p>
              {diasDisponiveis.length === 0 ? (
                <p className="text-sm text-ink-faint">Ainda não há respostas registradas para este checklist.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {diasDisponiveis.map(dia => (
                    <Button
                      key={dia}
                      variant={dia === diaSelecionado ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => setDiaSelecionado(dia)}
                      className="rounded-full"
                    >
                      {formatarDia(dia)}
                    </Button>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Resumo de respostas (se houver) */}
          {totalRespondidos > 0 && (
            <div className="mb-5 grid grid-cols-3 gap-3">
              <Card className="p-4 text-center">
                <p className="font-display text-2xl font-bold text-teal">{conformes}</p>
                <p className="mt-1 text-xs text-ink-muted">Conforme</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="font-display text-2xl font-bold text-coral">{naoConformes}</p>
                <p className="mt-1 text-xs text-ink-muted">Não Conforme</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="font-display text-2xl font-bold text-ink-faint">{naAplicavel}</p>
                <p className="mt-1 text-xs text-ink-muted">N/A</p>
              </Card>
            </div>
          )}

          {/* Lista de itens */}
          <Card className="p-6">
            <h2 className="mb-4 text-base font-bold text-ink">Itens do Checklist ({itens.length})</h2>

            {itens.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-faint">Nenhum item cadastrado.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {itens.map((item, index) => {
                  const r = respostas[item.id]
                  const temResposta = r?.resposta !== undefined && r.resposta !== null
                  const estilo = respostaEstilo[r?.resposta ?? 'semResposta']

                  return (
                    <div key={item.id} className={`rounded-xl p-4 ${estilo.bg}`}>
                      <div className="flex items-start gap-3">
                        <span className="min-w-[1.5rem] pt-0.5 text-xs text-ink-faint">{index + 1}.</span>
                        <div className="flex-1">
                          <p className="font-medium text-ink">{item.titulo}</p>
                          {item.descricao && <p className="mt-1 text-sm text-ink-muted">{item.descricao}</p>}
                          {temResposta && r.observacao && (
                            <p className="mt-2 text-sm italic text-ink-muted">&quot;{r.observacao}&quot;</p>
                          )}
                        </div>

                        <div className="flex flex-shrink-0 items-center gap-2">
                          {temResposta && r.foto_url && (
                            <button onClick={() => setFotoExpandida(r.foto_url!)} className="cursor-zoom-in p-1" title="Ver foto">
                              <img src={r.foto_url} alt="foto" className="h-10 w-10 rounded-md border-2 border-white object-cover" />
                            </button>
                          )}
                          <div className="flex items-center gap-1.5">
                            {estilo.icon}
                            <span className={`text-sm font-semibold ${estilo.text}`}>{estilo.label}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {totalRespondidos < itens.length && itens.length > 0 && (
              <p className="mt-4 text-center text-sm text-ink-faint">
                {totalRespondidos} de {itens.length} itens respondidos pelo funcionário
              </p>
            )}
          </Card>

        </div>
      </div>
    </>
  )
}
