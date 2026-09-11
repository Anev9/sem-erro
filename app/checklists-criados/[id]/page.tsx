'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  MinusCircle,
  Building2,
  User,
  Calendar,
  ClipboardList,
  AlertTriangle,
  History,
  ChevronDown,
  ChevronUp,
  FileDown,
  MessageSquare,
  Send,
  Trash2
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

interface Checklist {
  id: string
  nome: string
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
  foto_url?: string
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

const statusTone = {
  pendente: 'warning',
  em_andamento: 'info',
  concluido: 'success',
} as const

const statusLabel = {
  pendente: 'Pendente',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
} as const

const statusAcaoTone = {
  aguardando: 'warning',
  em_andamento: 'info',
  concluida: 'success',
  atrasada: 'danger',
} as const

const statusAcaoLabel = {
  aguardando: 'Aguardando',
  em_andamento: 'Em Andamento',
  concluida: 'Concluída',
  atrasada: 'Atrasada',
} as const

const prioridadeCor = { baixa: 'bg-teal', media: 'bg-amber', alta: 'bg-coral' } as const

const respostaEstilo = {
  sim: { bg: 'bg-teal-tint', icon: <CheckCircle size={20} className="text-teal" />, label: 'Sim', tone: 'success' as const },
  nao: { bg: 'bg-coral-tint', icon: <XCircle size={20} className="text-coral" />, label: 'Não', tone: 'danger' as const },
  na: { bg: 'bg-surface-2', icon: <MinusCircle size={20} className="text-ink-faint" />, label: 'N/A', tone: 'neutral' as const },
  pendente: { bg: 'bg-amber-tint', icon: <div className="h-5 w-5 rounded-full border-2 border-amber bg-white" />, label: 'Pendente', tone: 'warning' as const },
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
  const [fotoExpandida, setFotoExpandida] = useState<string | null>(null)
  const [comentarios, setComentarios] = useState<Array<{ id: string; item_id: string; autor: string; texto: string; created_at: string }>>([])
  const [comentarioAberto, setComentarioAberto] = useState<string | null>(null)
  const [novoComentario, setNovoComentario] = useState('')
  const [enviandoComentario, setEnviandoComentario] = useState(false)
  const [versoes, setVersoes] = useState<Array<{ id: string; versao: number; titulo: string; descricao?: string; itens: Array<{ titulo: string; descricao?: string; ordem: number }>; created_at: string }>>([])
  const [showVersoes, setShowVersoes] = useState(false)
  const [versaoExpandida, setVersaoExpandida] = useState<string | null>(null)

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
        toast.error('Checklist não encontrado.')
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
          observacao: r.observacao || '',
          foto_url: r.foto_url || undefined
        }
      })
      setRespostas(mapaRespostas)
      setAcoes(ac || [])

      const resVersoes = await fetch(`/api/aluno/checklists-criados/${checklistId}/versoes`)
      if (resVersoes.ok) setVersoes(await resVersoes.json())

      const resComentarios = await fetch(`/api/aluno/comentarios?checklist_id=${checklistId}`)
      if (resComentarios.ok) setComentarios(await resComentarios.json())

    } catch (err) {
      console.error('Erro ao carregar detalhes:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-ink-muted">Carregando detalhes...</p>
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
  const percentual = totalItens > 0 ? Math.round((conformes / Math.max(1, totalItens - naAplicavel)) * 100) : 0
  const percentualCor = percentual >= 80 ? 'text-teal' : percentual >= 50 ? 'text-amber' : 'text-coral'
  const percentualBarra = percentual >= 80 ? 'bg-teal' : percentual >= 50 ? 'bg-amber' : 'bg-coral'

  const formatarData = (d: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '—'

  function exportarPDF() {
    if (!checklist) return
    const labelResposta = { sim: '✅ Conforme', nao: '❌ Não Conforme', na: '➖ N/A', null: '⬜ Sem resposta' }
    const conteudo = `
      <html>
      <head>
        <meta charset="utf-8">
        <title>Relatório – ${checklist.nome}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 2rem; color: #1f2937; font-size: 13px; }
          h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
          .meta { color: #6b7280; margin-bottom: 1.5rem; font-size: 12px; }
          .resumo { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; }
          .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem; text-align: center; }
          .card .num { font-size: 2rem; font-weight: bold; }
          .card .label { font-size: 11px; color: #6b7280; }
          .item { border: 1px solid #e5e7eb; border-radius: 6px; padding: 0.875rem; margin-bottom: 0.75rem; }
          .item-titulo { font-weight: 600; margin-bottom: 0.375rem; }
          .item-resposta { font-size: 12px; }
          .obs { font-size: 11px; color: #6b7280; margin-top: 0.25rem; }
          h2 { font-size: 1rem; margin: 1.5rem 0 0.75rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; }
          @media print { body { margin: 1rem; } }
        </style>
      </head>
      <body>
        <h1>${checklist.nome}</h1>
        <p class="meta">
          ${checklist.empresas ? `Empresa: ${checklist.empresas.nome_fantasia} | ` : ''}
          ${checklist.colaboradores ? `Colaborador: ${checklist.colaboradores.nome} | ` : ''}
          Prazo: ${formatarData(checklist.data_fim)} |
          Status: ${statusLabel[checklist.status as keyof typeof statusLabel] || checklist.status} |
          Gerado em: ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
        <h2>Resumo</h2>
        <div class="resumo">
          <div class="card"><div class="num" style="color:#16b88a">${conformes}</div><div class="label">Conforme</div></div>
          <div class="card"><div class="num" style="color:#fb5c66">${naoConformes}</div><div class="label">Não Conforme</div></div>
          <div class="card"><div class="num" style="color:#6b7280">${naAplicavel}</div><div class="label">N/A</div></div>
          <div class="card"><div class="num" style="color:#ff7a3d">${percentual}%</div><div class="label">Conformidade</div></div>
        </div>
        <h2>Itens (${totalItens})</h2>
        ${itens.map(item => {
          const resp = respostas[item.id]
          const respLabel = labelResposta[(resp?.resposta ?? null) as keyof typeof labelResposta]
          return `
            <div class="item">
              <div class="item-titulo">${item.ordem}. ${item.titulo}</div>
              <div class="item-resposta">${respLabel}</div>
              ${resp?.observacao ? `<div class="obs">Obs: ${resp.observacao}</div>` : ''}
            </div>
          `
        }).join('')}
        ${acoes.length > 0 ? `
          <h2>Ações Corretivas (${acoes.length})</h2>
          ${acoes.map(a => `
            <div class="item">
              <div class="item-titulo">${a.titulo}</div>
              <div class="item-resposta">Status: ${statusAcaoLabel[a.status as keyof typeof statusAcaoLabel] || a.status} | Prioridade: ${a.prioridade}${a.responsavel ? ` | Responsável: ${a.responsavel}` : ''}${a.prazo ? ` | Prazo: ${formatarData(a.prazo)}` : ''}</div>
            </div>
          `).join('')}
        ` : ''}
      </body>
      </html>
    `
    const janela = window.open('', '_blank')
    if (!janela) return
    janela.document.write(conteudo)
    janela.document.close()
    janela.focus()
    setTimeout(() => { janela.print(); janela.close() }, 500)
  }

  async function enviarComentario(itemId: string) {
    if (!novoComentario.trim()) return
    setEnviandoComentario(true)
    try {
      const res = await fetch('/api/aluno/comentarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checklist_id: checklistId, item_id: itemId, texto: novoComentario }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Erro ao enviar')
      const novo = await res.json()
      setComentarios(prev => [...prev, novo])
      setNovoComentario('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar comentário')
    } finally {
      setEnviandoComentario(false)
    }
  }

  async function excluirComentario(id: string) {
    try {
      const res = await fetch(`/api/aluno/comentarios?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao excluir')
      setComentarios(prev => prev.filter(c => c.id !== id))
    } catch {
      toast.error('Erro ao excluir comentário')
    }
  }

  const dynamicStatus = (respondidos >= totalItens && totalItens > 0
    ? 'concluido'
    : respondidos > 0
    ? 'em_andamento'
    : checklist.status || 'pendente') as keyof typeof statusTone

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1000px] px-6 py-8">

        {/* Header */}
        <div className="mb-5">
          <button
            onClick={() => router.push('/checklists-criados')}
            className="mb-4 inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-sm font-medium text-ink-muted shadow-soft-sm transition-colors hover:text-ink cursor-pointer"
          >
            <ArrowLeft size={16} />
            Voltar para Checklists
          </button>

          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold text-ink">{checklist.nome}</h1>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-ink-muted">
                {checklist.empresas && (
                  <span className="flex items-center gap-1.5"><Building2 size={14} /> {checklist.empresas.nome_fantasia}</span>
                )}
                {checklist.colaboradores && (
                  <span className="flex items-center gap-1.5"><User size={14} /> {checklist.colaboradores.nome}</span>
                )}
                <span className="flex items-center gap-1.5"><Calendar size={14} /> Prazo: {formatarData(checklist.data_fim)}</span>
                <span className="flex items-center gap-1.5"><ClipboardList size={14} /> {respondidos}/{totalItens} respondidos</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge tone={statusTone[dynamicStatus]}>{statusLabel[dynamicStatus]}</Badge>
              <Button variant="secondary" onClick={exportarPDF} icon={<FileDown size={14} />} title="Exportar relatório em PDF">
                Exportar PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Cards de resumo */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Card className="p-5 text-center">
            <p className="font-display text-3xl font-bold text-teal">{conformes}</p>
            <p className="mt-1 text-xs font-semibold text-ink-muted">Conforme</p>
          </Card>
          <Card className="p-5 text-center">
            <p className="font-display text-3xl font-bold text-coral">{naoConformes}</p>
            <p className="mt-1 text-xs font-semibold text-ink-muted">Não Conforme</p>
          </Card>
          <Card className="p-5 text-center">
            <p className="font-display text-3xl font-bold text-ink-faint">{naAplicavel}</p>
            <p className="mt-1 text-xs font-semibold text-ink-muted">N/A</p>
          </Card>
          {semResposta > 0 && (
            <Card className="p-5 text-center">
              <p className="font-display text-3xl font-bold text-amber">{semResposta}</p>
              <p className="mt-1 text-xs font-semibold text-ink-muted">Sem Resposta</p>
            </Card>
          )}
          <Card className="bg-brand p-5 text-center shadow-[0_8px_16px_-8px_rgba(255,122,61,0.6)]">
            <p className="font-display text-3xl font-bold text-white">{percentual}%</p>
            <p className="mt-1 text-xs font-semibold text-white/85">Conformidade</p>
          </Card>
        </div>

        {/* Barra de progresso */}
        <Card className="mb-5 p-5">
          <div className="mb-2 flex justify-between text-sm font-semibold text-ink-muted">
            <span>Conformidade geral</span>
            <span className={percentualCor}>{percentual}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
            <div className={`h-full rounded-full transition-[width] duration-500 ${percentualBarra}`} style={{ width: `${percentual}%` }} />
          </div>
        </Card>

        {/* Lista de itens */}
        <Card className="mb-5 p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-base font-bold text-ink">
            <ClipboardList size={20} className="text-brand" />
            Itens do Checklist
          </h2>

          {/* Lightbox */}
          {fotoExpandida && (
            <div
              onClick={() => setFotoExpandida(null)}
              className="fixed inset-0 z-[9999] flex cursor-zoom-out items-center justify-center bg-black/85 p-4"
            >
              <img src={fotoExpandida} alt="Foto ampliada" className="max-h-[90vh] max-w-full rounded-xl object-contain" />
            </div>
          )}

          <div className="flex flex-col gap-2.5">
            {itens.map((item, index) => {
              const r = respostas[item.id]
              const acaoItem = acoes.find(a => a.item_id === item.id)
              const estilo = respostaEstilo[r?.resposta ?? 'pendente']
              const numComentarios = comentarios.filter(c => c.item_id === item.id).length

              return (
                <div key={item.id} className={`rounded-xl p-4 ${estilo.bg}`}>
                  <div className="flex items-start gap-3.5">
                    <div className="mt-0.5 flex-shrink-0">{estilo.icon}</div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-ink-faint">{index + 1}.</span>
                        <p className="text-sm font-medium text-ink">{item.titulo}</p>
                      </div>

                      {r?.observacao && (
                        <p className="mt-1.5 border-l-2 border-ink-faint/40 pl-3 text-xs italic text-ink-muted">
                          {r.observacao}
                        </p>
                      )}

                      {r?.foto_url && (
                        <button
                          onClick={() => setFotoExpandida(r.foto_url!)}
                          className="mt-2 flex cursor-zoom-in items-center gap-2"
                          title="Ver foto"
                        >
                          <img
                            src={r.foto_url}
                            alt="Foto do funcionário"
                            className="h-16 w-16 rounded-lg border-2 border-white object-cover"
                          />
                          <span className="text-xs font-medium text-brand">Ver foto</span>
                        </button>
                      )}

                      {acaoItem && (
                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-amber">
                          <AlertTriangle size={12} />
                          Ação: {acaoItem.titulo}
                        </div>
                      )}

                      <button
                        onClick={() => setComentarioAberto(comentarioAberto === item.id ? null : item.id)}
                        className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-brand"
                      >
                        <MessageSquare size={12} />
                        {numComentarios > 0 ? `${numComentarios} comentário(s)` : 'Comentar'}
                      </button>

                      {comentarioAberto === item.id && (
                        <div className="mt-3 rounded-xl bg-white p-3.5 shadow-soft-sm">
                          {comentarios.filter(c => c.item_id === item.id).map(com => (
                            <div key={com.id} className="flex items-start justify-between gap-2 border-b border-surface-2 py-2 last:border-0">
                              <div>
                                <p className="text-xs font-bold text-brand">{com.autor}</p>
                                <p className="mt-0.5 text-sm text-ink">{com.texto}</p>
                                <p className="mt-0.5 text-[11px] text-ink-faint">{new Date(com.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                              <button onClick={() => excluirComentario(com.id)} className="flex-shrink-0 text-coral">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                          <div className="mt-3 flex gap-2">
                            <input
                              type="text"
                              value={novoComentario}
                              onChange={(e) => setNovoComentario(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarComentario(item.id) } }}
                              placeholder="Adicionar comentário..."
                              className="flex-1 rounded-lg bg-surface-2 px-3 py-2 text-sm outline-none"
                            />
                            <button
                              onClick={() => enviarComentario(item.id)}
                              disabled={enviandoComentario || !novoComentario.trim()}
                              className="flex items-center justify-center rounded-lg bg-brand px-3 py-2 text-white disabled:opacity-60"
                            >
                              <Send size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0">
                      <Badge tone={estilo.tone}>{estilo.label}</Badge>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Ações corretivas vinculadas */}
        {acoes.length > 0 && (
          <Card className="mb-5 p-6">
            <h2 className="mb-4 flex items-center gap-2 font-display text-base font-bold text-ink">
              <AlertTriangle size={20} className="text-amber" />
              Ações Corretivas ({acoes.length})
            </h2>

            <div className="flex flex-col gap-2.5">
              {acoes.map(acao => (
                <div key={acao.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-2 p-4">
                  <div className="flex min-w-[200px] flex-1 items-center gap-3">
                    <div className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${prioridadeCor[acao.prioridade as keyof typeof prioridadeCor] || 'bg-amber'}`} title={`Prioridade ${acao.prioridade}`} />
                    <div>
                      <p className="text-sm font-semibold text-ink">{acao.titulo}</p>
                      {acao.responsavel && (
                        <p className="mt-0.5 text-xs text-ink-muted">Responsável: {acao.responsavel}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {acao.prazo && (
                      <span className="text-xs text-ink-muted">Prazo: {formatarData(acao.prazo)}</span>
                    )}
                    <Badge tone={statusAcaoTone[acao.status as keyof typeof statusAcaoTone] || 'warning'}>
                      {statusAcaoLabel[acao.status as keyof typeof statusAcaoLabel] || acao.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            <Button variant="secondary" className="mt-4" onClick={() => router.push('/acoes')}>
              Ver todas as ações
            </Button>
          </Card>
        )}

        {/* Histórico de versões */}
        {versoes.length > 0 && (
          <Card className="p-6">
            <button
              onClick={() => setShowVersoes(!showVersoes)}
              className="flex w-full items-center justify-between"
            >
              <h2 className="flex items-center gap-2 font-display text-base font-bold text-ink">
                <History size={20} className="text-brand" />
                Histórico de Versões ({versoes.length})
              </h2>
              {showVersoes ? <ChevronUp size={20} className="text-ink-faint" /> : <ChevronDown size={20} className="text-ink-faint" />}
            </button>

            {showVersoes && (
              <div className="mt-4 flex flex-col gap-2.5">
                {versoes.map(v => (
                  <div key={v.id} className="overflow-hidden rounded-xl bg-surface-2">
                    <button
                      onClick={() => setVersaoExpandida(versaoExpandida === v.id ? null : v.id)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left"
                    >
                      <div>
                        <span className="text-sm font-bold text-ink-muted">Versão {v.versao}</span>
                        <span className="ml-3 text-xs text-ink-faint">
                          {new Date(v.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <p className="mt-0.5 text-sm text-ink-muted">{v.titulo}</p>
                      </div>
                      {versaoExpandida === v.id ? <ChevronUp size={16} className="flex-shrink-0 text-ink-faint" /> : <ChevronDown size={16} className="flex-shrink-0 text-ink-faint" />}
                    </button>

                    {versaoExpandida === v.id && (
                      <div className="border-t border-white/60 px-4 pb-4 pt-3">
                        {v.descricao && <p className="mb-3 text-sm text-ink-muted">{v.descricao}</p>}
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                          Itens ({v.itens.length})
                        </p>
                        <ol className="flex flex-col gap-1 pl-5">
                          {v.itens.map((item, idx) => (
                            <li key={idx} className="list-decimal text-sm text-ink-muted">{item.titulo}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

      </div>
    </div>
  )
}
