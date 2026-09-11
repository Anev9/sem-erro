'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  MinusCircle,
  ChevronRight,
  ChevronLeft,
  ClipboardList,
  Building2,
  Calendar,
  MessageSquare,
  Send,
  Camera,
  X,
  WifiOff,
  RefreshCw,
} from 'lucide-react'
import {
  salvarChecklistCache,
  lerChecklistCache,
  salvarRespostaPendente,
  sincronizarPendentes,
  contarRespostasPendentes,
} from '@/lib/offline-db'
import { toast } from 'sonner'
import { calcularAlertaHorario } from '@/lib/prazo-horario'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

interface Checklist {
  id: string
  nome: string
  descricao?: string
  proxima_execucao?: string
  empresa_id: string
  colaborador_id: string
  hora_limite?: string | null
  empresas?: { nome_fantasia: string }
}

interface Item {
  id: string
  titulo: string
  descricao?: string
  ordem: number
  foto_obrigatoria?: boolean
}

interface Resposta {
  item_id: string
  resposta: 'sim' | 'nao' | 'na' | null
  observacao: string
}

type MapaRespostas = Record<string, Resposta>

const respostaBtnBase = 'flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-base font-semibold transition-all hover:-translate-y-0.5 cursor-pointer'

export default function ResponderChecklistPage() {
  const router = useRouter()
  const params = useParams()
  const checklistId = params.id as string

  const [colaboradorId, setColaboradorId] = useState<string | null>(null)
  const [checklist, setChecklist] = useState<Checklist | null>(null)
  const [itens, setItens] = useState<Item[]>([])
  const [respostas, setRespostas] = useState<MapaRespostas>({})
  const [itemAtual, setItemAtual] = useState(0)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [concluido, setConcluido] = useState(false)
  const [fotos, setFotos] = useState<Record<string, string>>({})       // itemId → dataURL preview
  const [fotoUrls, setFotoUrls] = useState<Record<string, string>>({}) // itemId → URL pública
  const [uploadandoFoto, setUploadandoFoto] = useState(false)
  const [fotoExpandida, setFotoExpandida] = useState<string | null>(null)

  // ── Estado offline ──────────────────────────────────────────────────────
  const [isOnline, setIsOnline] = useState(true)
  const [pendentes, setPendentes] = useState(0)
  const [sincronizando, setSincronizando] = useState(false)
  const [modoCache, setModoCache] = useState(false) // true = dados vieram do cache local

  // Força recalcular o alerta de horário limite a cada minuto
  const [, setTick] = useState(0)
  useEffect(() => {
    const intervalo = setInterval(() => setTick(t => t + 1), 60000)
    return () => clearInterval(intervalo)
  }, [])

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const online = () => {
      setIsOnline(true)
      triggerSync()
    }
    const offline = () => setIsOnline(false)
    window.addEventListener('online', online)
    window.addEventListener('offline', offline)
    return () => { window.removeEventListener('online', online); window.removeEventListener('offline', offline) }
  }, [])

  // Ouve mensagem do Service Worker quando sincronização termina
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'SYNC_CONCLUIDO') atualizarContadorPendentes()
    }
    navigator.serviceWorker?.addEventListener('message', handler)
    return () => navigator.serviceWorker?.removeEventListener('message', handler)
  }, [])

  async function atualizarContadorPendentes() {
    try {
      const count = await contarRespostasPendentes()
      setPendentes(count)
    } catch { /* IndexedDB indisponível */ }
  }

  async function triggerSync() {
    setSincronizando(true)
    try {
      // Tenta usar Background Sync do SW; fallback manual
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const reg = await navigator.serviceWorker.ready
        await (reg as any).sync.register('sync-respostas')
      } else {
        await sincronizarPendentes()
      }
      await atualizarContadorPendentes()
    } catch { /* silencioso */ } finally {
      setSincronizando(false)
    }
  }

  useEffect(() => {
    carregarDados()
    atualizarContadorPendentes()
  }, [checklistId])

  async function carregarDados() {
    try {
      // Auth via localStorage
      let colaboradorIdLocal: string | null = null

      const userStr = localStorage.getItem('user')
      const userType = localStorage.getItem('userType')
      if (userStr) {
        const parsed = JSON.parse(userStr)
        if (
          parsed.role === 'colaborador' ||
          userType === 'colaborador' ||
          (parsed.empresa_id && parsed.id && !parsed.aluno_id)
        ) {
          colaboradorIdLocal = parsed.id
        }
      }

      if (!colaboradorIdLocal) {
        try {
          const res = await fetch('/api/colaborador/sessao')
          if (!res.ok) { router.push('/login'); return }
          const userData = await res.json()
          localStorage.setItem('user', JSON.stringify(userData))
          colaboradorIdLocal = userData.id
        } catch {
          router.push('/login')
          return
        }
      }

      setColaboradorId(colaboradorIdLocal)

      // ── Tenta buscar online ─────────────────────────────────────────────
      let checklistData: Record<string, unknown> | null = null
      let itensData: Record<string, unknown>[] = []
      let respostasData: Record<string, unknown>[] = []

      try {
        const res = await fetch(`/api/colaborador/checklist-detail/${checklistId}?colaborador_id=${colaboradorIdLocal}`)
        if (res.ok) {
          const json = await res.json()
          checklistData = json.checklist
          itensData = json.itens || []
          respostasData = json.respostas || []

          // Salva no cache para uso offline futuro
          await salvarChecklistCache({
            checklistId,
            checklist: checklistData!,
            itens: itensData,
            respostas: respostasData,
            savedAt: Date.now(),
          })
        } else {
          throw new Error('API indisponível')
        }
      } catch {
        // ── Fallback: cache local ──────────────────────────────────────────
        const cache = await lerChecklistCache(checklistId)
        if (cache) {
          checklistData = cache.checklist
          itensData = cache.itens
          respostasData = cache.respostas
          setModoCache(true)
        } else {
          toast.error('Sem conexão e checklist não encontrado em cache. Abra este checklist online primeiro.')
          router.push('/dashboard-funcionario')
          return
        }
      }

      setChecklist(checklistData as unknown as Checklist)

      const listaItens: Item[] = itensData as unknown as Item[]
      setItens(listaItens)

      const mapaInicial: MapaRespostas = {}
      const mapaFotoUrls: Record<string, string> = {}

      listaItens.forEach((item) => {
        const respostaExistente = respostasData.find((r) => r.item_id === item.id)
        mapaInicial[item.id] = {
          item_id: item.id,
          resposta: (respostaExistente?.resposta as 'sim' | 'nao' | 'na') ?? null,
          observacao: (respostaExistente?.observacao as string) ?? ''
        }
        if (respostaExistente?.foto_url) {
          mapaFotoUrls[item.id] = respostaExistente.foto_url as string
        }
      })

      if (Object.keys(mapaFotoUrls).length > 0) {
        setFotoUrls(mapaFotoUrls)
        setFotos(mapaFotoUrls)
      }

      setRespostas(mapaInicial)

      const totalRespondidos = Object.values(mapaInicial).filter(r => r.resposta !== null).length
      if (totalRespondidos === listaItens.length && listaItens.length > 0) {
        setConcluido(true)
      }

      const primeiroSemResposta = listaItens.findIndex((item) => !mapaInicial[item.id]?.resposta)
      if (primeiroSemResposta !== -1) setItemAtual(primeiroSemResposta)

    } catch (error) {
      console.error('Erro ao carregar checklist:', error)
      toast.error('Erro ao carregar checklist.')
    } finally {
      setLoading(false)
    }
  }

  async function salvarResposta(itemId: string, resposta: 'sim' | 'nao' | 'na', observacao: string, foto_url?: string) {
    if (!colaboradorId) return
    setSalvando(true)

    const fotoSalvar = foto_url ?? fotoUrls[itemId] ?? null

    try {
      const res = await fetch('/api/colaborador/resposta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checklist_futuro_id: checklistId,
          colaborador_id: colaboradorId,
          item_id: itemId,
          resposta,
          observacao,
          foto_url: fotoSalvar,
        }),
      })

      if (!res.ok) throw new Error('Erro ao salvar')

    } catch {
      // Sem internet ou API fora do ar → salva localmente
      try {
        await salvarRespostaPendente({
          checklistId,
          colaboradorId,
          itemId,
          resposta,
          observacao,
          foto_url: fotoSalvar,
        })
        await atualizarContadorPendentes()
      } catch (dbErr) {
        console.error('[offline-db] Erro ao salvar localmente:', dbErr)
      }
    } finally {
      setSalvando(false)
    }
  }

  async function handleFotoCaptura(e: React.ChangeEvent<HTMLInputElement>) {
    const item = itens[itemAtual]
    if (!item || !e.target.files?.[0]) return

    const file = e.target.files[0]
    setUploadandoFoto(true)

    try {
      // Preview local imediato
      const reader = new FileReader()
      reader.onload = (ev) => {
        setFotos(prev => ({ ...prev, [item.id]: ev.target?.result as string }))
      }
      reader.readAsDataURL(file)

      // Upload via API route (usa service role, sem problemas de permissão)
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `checklists/${checklistId}/${item.id}/${Date.now()}.${ext}`

      const form = new FormData()
      form.append('file', file)
      form.append('path', path)

      const res = await fetch('/api/upload-foto', { method: 'POST', body: form })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro no upload')
      }

      const { publicUrl } = await res.json()
      setFotoUrls(prev => ({ ...prev, [item.id]: publicUrl }))

      // Se já tem resposta, salvar com foto_url
      const respostaAtualItem = respostas[item.id]
      if (respostaAtualItem?.resposta) {
        await salvarResposta(item.id, respostaAtualItem.resposta, respostaAtualItem.observacao, publicUrl)
      }
    } catch (error) {
      console.error('Erro ao enviar foto:', error)
      toast.error('Erro ao enviar foto. Tente novamente.')
    } finally {
      setUploadandoFoto(false)
      e.target.value = ''
    }
  }

  function removerFoto() {
    const item = itens[itemAtual]
    if (!item) return
    setFotos(prev => { const n = { ...prev }; delete n[item.id]; return n })
    setFotoUrls(prev => { const n = { ...prev }; delete n[item.id]; return n })
  }

  function selecionarResposta(valor: 'sim' | 'nao' | 'na') {
    const item = itens[itemAtual]
    if (!item) return

    if (item.foto_obrigatoria && !fotoUrls[item.id]) {
      toast.warning('Este item exige uma foto antes de responder.')
      return
    }

    const observacaoAtual = respostas[item.id]?.observacao || ''

    setRespostas(prev => ({
      ...prev,
      [item.id]: { item_id: item.id, resposta: valor, observacao: observacaoAtual }
    }))

    salvarResposta(item.id, valor, observacaoAtual)
  }

  function atualizarObservacao(texto: string) {
    const item = itens[itemAtual]
    if (!item) return

    setRespostas(prev => ({
      ...prev,
      [item.id]: { ...prev[item.id], observacao: texto }
    }))
  }

  async function salvarObservacao() {
    const item = itens[itemAtual]
    if (!item || !respostas[item.id]?.resposta) return

    const { resposta, observacao } = respostas[item.id]
    await salvarResposta(item.id, resposta!, observacao)
  }

  function avancar() {
    if (itemAtual < itens.length - 1) {
      setItemAtual(itemAtual + 1)
    } else {
      verificarConclusao()
    }
  }

  function voltar() {
    if (itemAtual > 0) {
      setItemAtual(itemAtual - 1)
    }
  }

  function verificarConclusao() {
    const totalRespondidos = Object.values(respostas).filter(r => r.resposta !== null).length
    if (totalRespondidos === itens.length) {
      setConcluido(true)
    } else {
      const primeiroSemResposta = itens.findIndex(item => !respostas[item.id]?.resposta)
      if (primeiroSemResposta !== -1) {
        setItemAtual(primeiroSemResposta)
        toast.warning(`Ainda há ${itens.length - totalRespondidos} pergunta(s) sem resposta.`)
      }
    }
  }

  const totalRespondidos = Object.values(respostas).filter(r => r.resposta !== null).length
  const progresso = itens.length > 0 ? (totalRespondidos / itens.length) * 100 : 0
  const itemAtualDados = itens[itemAtual]
  const respostaAtual = itemAtualDados ? respostas[itemAtualDados.id] : null

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-ink-muted">Carregando checklist...</p>
      </div>
    )
  }

  if (!checklist || itens.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-sm text-ink-muted">Checklist não encontrado ou sem itens.</p>
          <Button variant="primary" onClick={() => router.push('/dashboard-funcionario')}>
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    )
  }

  // Tela de conclusão
  if (concluido) {
    const conformes = Object.values(respostas).filter(r => r.resposta === 'sim').length
    const naoConformes = Object.values(respostas).filter(r => r.resposta === 'nao').length
    const naAplicavel = Object.values(respostas).filter(r => r.resposta === 'na').length

    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-[680px] px-6 py-8">
          <Card className="p-8 text-center sm:p-12">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-teal-tint">
              <CheckCircle size={44} className="text-teal" />
            </div>

            <h1 className="mb-2 font-display text-2xl font-bold text-ink">Checklist Concluído!</h1>
            <p className="mb-8 text-sm text-ink-muted">{checklist.nome}</p>

            {/* Resumo */}
            <div className="mb-8 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-teal-tint p-4">
                <p className="text-2xl font-bold text-teal">{conformes}</p>
                <p className="mt-1 text-xs text-teal">Conforme</p>
              </div>
              <div className="rounded-2xl bg-coral-tint p-4">
                <p className="text-2xl font-bold text-coral">{naoConformes}</p>
                <p className="mt-1 text-xs text-coral">Não Conforme</p>
              </div>
              <div className="rounded-2xl bg-surface-2 p-4">
                <p className="text-2xl font-bold text-ink-muted">{naAplicavel}</p>
                <p className="mt-1 text-xs text-ink-muted">N/A</p>
              </div>
            </div>

            {/* Lightbox */}
            {fotoExpandida && (
              <div
                onClick={() => setFotoExpandida(null)}
                className="fixed inset-0 z-[9999] flex cursor-zoom-out items-center justify-center bg-black/85 p-4"
              >
                <img src={fotoExpandida} alt="Foto ampliada" className="max-h-[90vh] max-w-full rounded-xl object-contain" />
              </div>
            )}

            {/* Itens respondidos */}
            <div className="mb-8 max-h-[420px] overflow-y-auto text-left">
              {itens.map((item, index) => {
                const r = respostas[item.id]
                const cor = r?.resposta === 'sim' ? 'text-teal' : r?.resposta === 'nao' ? 'text-coral' : 'text-ink-muted'
                const bg = r?.resposta === 'sim' ? 'bg-teal-tint' : r?.resposta === 'nao' ? 'bg-coral-tint' : 'bg-surface-2'
                const label = r?.resposta === 'sim' ? 'Sim' : r?.resposta === 'nao' ? 'Não' : 'N/A'
                const fotoUrl = fotoUrls[item.id]

                return (
                  <div key={item.id} className={`mb-2 overflow-hidden rounded-xl ${bg}`}>
                    <div className="flex items-center gap-3 p-3">
                      <span className="min-w-[1.5rem] text-xs text-ink-faint">{index + 1}.</span>
                      <span className="flex-1 text-sm text-ink">{item.titulo}</span>
                      {fotoUrl && (
                        <button onClick={() => setFotoExpandida(fotoUrl)} className="flex-shrink-0 cursor-zoom-in" title="Ver foto">
                          <img src={fotoUrl} alt="foto" className="h-10 w-10 rounded-md border-2 border-white object-cover" />
                        </button>
                      )}
                      <span className={`min-w-[2.5rem] text-right text-xs font-semibold ${cor}`}>{label}</span>
                    </div>
                    {r?.observacao && (
                      <p className="mx-3 mb-2 ml-10 text-xs italic text-ink-muted">&quot;{r.observacao}&quot;</p>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="secondary" onClick={() => { setConcluido(false); setItemAtual(0) }}>
                Revisar Respostas
              </Button>
              <Button variant="primary" onClick={() => router.push('/dashboard-funcionario')} icon={<ChevronRight size={18} />} className="flex-row-reverse">
                Voltar ao Dashboard
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Banner offline / sincronizando */}
      {!isOnline && (
        <div className="flex items-center gap-2.5 bg-ink px-6 py-2.5 text-sm text-white">
          <WifiOff size={15} className="flex-shrink-0 text-brand" />
          <span className="flex-1">
            <strong>Modo offline.</strong> Suas respostas estão sendo salvas no dispositivo{pendentes > 0 ? ` (${pendentes} pendente${pendentes > 1 ? 's' : ''})` : ''}.
          </span>
        </div>
      )}
      {isOnline && pendentes > 0 && (
        <div className="flex items-center gap-2.5 bg-amber px-6 py-2.5 text-sm text-white">
          <RefreshCw size={15} className={`flex-shrink-0 ${sincronizando ? 'animate-spin' : ''}`} />
          <span className="flex-1">
            {sincronizando ? 'Sincronizando respostas...' : `${pendentes} resposta${pendentes > 1 ? 's' : ''} pendente${pendentes > 1 ? 's' : ''} de sincronização.`}
          </span>
          {!sincronizando && (
            <button onClick={triggerSync} className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
              Sincronizar agora
            </button>
          )}
        </div>
      )}
      {modoCache && isOnline && pendentes === 0 && (
        <div className="border-b border-amber/30 bg-amber-tint px-6 py-2.5 text-sm text-amber">
          ⚠️ Carregado do cache local. Dados podem estar desatualizados.
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-soft-sm">
        <div className="mx-auto max-w-[680px] px-6 py-5">
          <button
            onClick={() => router.push('/dashboard-funcionario')}
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
          >
            <ArrowLeft size={16} />
            Voltar
          </button>

          <h1 className="mb-1.5 font-display text-lg font-bold text-ink">{checklist.nome}</h1>

          <div className="flex flex-wrap gap-4">
            {checklist.empresas && (
              <span className="flex items-center gap-1.5 text-sm text-ink-muted">
                <Building2 size={14} />
                {checklist.empresas.nome_fantasia}
              </span>
            )}
            {checklist.proxima_execucao && (
              <span className="flex items-center gap-1.5 text-sm text-ink-muted">
                <Calendar size={14} />
                {new Date(checklist.proxima_execucao).toLocaleDateString('pt-BR')}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-sm text-ink-muted">
              <ClipboardList size={14} />
              {totalRespondidos}/{itens.length} respondidas
            </span>
          </div>

          {checklist.hora_limite && (() => {
            const alerta = calcularAlertaHorario(checklist.hora_limite)
            const tone = alerta?.nivel === 'vencido' ? 'danger' : alerta?.nivel === 'proximo' ? 'warning' : 'neutral'
            return (
              <div className="mt-3 inline-block">
                <Badge tone={tone}>
                  ⏰ {alerta?.nivel === 'vencido'
                    ? `Prazo de hoje vencido às ${alerta.horaFormatada}`
                    : alerta?.nivel === 'proximo'
                      ? `Faltam ${alerta.minutosRestantes} min para o prazo (${alerta.horaFormatada})`
                      : `Responder até ${checklist.hora_limite.slice(0, 5)}`}
                </Badge>
              </div>
            )
          })()}
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="border-b border-surface-2 bg-white px-6 py-3">
        <div className="mx-auto max-w-[680px]">
          <div className="mb-2 flex justify-between text-xs text-ink-muted">
            <span>Progresso</span>
            <span className="font-semibold text-brand">{Math.round(progresso)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${progresso}%` }} />
          </div>

          {/* Indicadores de itens */}
          <div className="mt-3 flex flex-wrap gap-1">
            {itens.map((item, index) => {
              const r = respostas[item.id]?.resposta
              const bg = r === 'sim' ? 'bg-teal' : r === 'nao' ? 'bg-coral' : r === 'na' ? 'bg-ink-faint' : index === itemAtual ? 'bg-brand' : 'bg-surface-2'
              const textColor = r || index === itemAtual ? 'text-white' : 'text-ink-faint'
              return (
                <button
                  key={item.id}
                  onClick={() => setItemAtual(index)}
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${bg} ${textColor} ${index === itemAtual ? 'ring-2 ring-brand ring-offset-1' : ''}`}
                >
                  {index + 1}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="mx-auto max-w-[680px] px-6 py-6">
        {itemAtualDados && (
          <div key={itemAtualDados.id}>

            {/* Card da pergunta */}
            <Card className="mb-6 p-7">
              <div className="mb-3">
                <Badge tone="neutral">Pergunta {itemAtual + 1} de {itens.length}</Badge>
              </div>

              <h2 className="mb-2 text-lg font-semibold leading-relaxed text-ink">{itemAtualDados.titulo}</h2>

              {itemAtualDados.descricao && (
                <p className="text-sm leading-relaxed text-ink-muted">{itemAtualDados.descricao}</p>
              )}
            </Card>

            {/* Botões de resposta */}
            <div className="mb-6 grid grid-cols-3 gap-3">
              <button
                onClick={() => selecionarResposta('sim')}
                className={`${respostaBtnBase} ${respostaAtual?.resposta === 'sim' ? 'border-teal bg-teal text-white shadow-[0_8px_16px_-8px_rgba(22,184,138,0.5)]' : 'border-surface-2 bg-white text-ink-muted shadow-soft-sm'}`}
              >
                <CheckCircle size={26} />
                Sim
              </button>

              <button
                onClick={() => selecionarResposta('nao')}
                className={`${respostaBtnBase} ${respostaAtual?.resposta === 'nao' ? 'border-coral bg-coral text-white shadow-[0_8px_16px_-8px_rgba(251,92,102,0.5)]' : 'border-surface-2 bg-white text-ink-muted shadow-soft-sm'}`}
              >
                <XCircle size={26} />
                Não
              </button>

              <button
                onClick={() => selecionarResposta('na')}
                className={`${respostaBtnBase} ${respostaAtual?.resposta === 'na' ? 'border-ink-faint bg-ink-faint text-white shadow-soft' : 'border-surface-2 bg-white text-ink-muted shadow-soft-sm'}`}
              >
                <MinusCircle size={26} />
                N/A
              </button>
            </div>

            {/* Observação */}
            <Card className="mb-6 p-5">
              <label className="mb-3 flex items-center gap-2 text-sm font-medium text-ink">
                <MessageSquare size={16} className="text-ink-muted" />
                Observação (opcional)
              </label>
              <div className="flex gap-3">
                <textarea
                  value={respostaAtual?.observacao || ''}
                  onChange={(e) => atualizarObservacao(e.target.value)}
                  onBlur={salvarObservacao}
                  placeholder="Adicione uma observação sobre este item..."
                  rows={3}
                  className="flex-1 resize-y rounded-xl bg-surface-2 p-3 text-sm text-ink outline-none"
                />
                <button
                  onClick={salvarObservacao}
                  title="Salvar observação"
                  className="flex h-fit items-center justify-center rounded-xl bg-brand-tint p-3 text-brand"
                >
                  <Send size={16} />
                </button>
              </div>
            </Card>

            {/* Foto */}
            <Card className={`mb-6 p-5 ${itemAtualDados.foto_obrigatoria && !fotoUrls[itemAtualDados.id] ? 'border-2 border-coral' : ''}`}>
              <label className={`mb-3 flex items-center gap-2 text-sm font-medium ${itemAtualDados.foto_obrigatoria ? 'text-coral' : 'text-ink'}`}>
                <Camera size={16} className={itemAtualDados.foto_obrigatoria ? 'text-coral' : 'text-ink-muted'} />
                {itemAtualDados.foto_obrigatoria ? 'Foto obrigatória *' : 'Foto (opcional)'}
              </label>

              {fotos[itemAtualDados.id] ? (
                <div className="relative inline-block w-full">
                  <img
                    src={fotos[itemAtualDados.id]}
                    alt="Foto capturada"
                    className="max-h-[240px] w-full rounded-xl object-cover"
                  />
                  <button
                    onClick={removerFoto}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white"
                  >
                    <X size={14} />
                  </button>
                  <label
                    htmlFor={`foto-input-${itemAtualDados.id}`}
                    className="mt-2 block cursor-pointer text-center text-xs font-medium text-brand"
                  >
                    Trocar foto
                  </label>
                </div>
              ) : (
                <label
                  htmlFor={`foto-input-${itemAtualDados.id}`}
                  className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink-faint/30 bg-surface-2 p-6 text-ink-muted ${uploadandoFoto ? 'cursor-wait' : 'cursor-pointer'}`}
                >
                  {uploadandoFoto ? (
                    <p className="text-sm">Enviando foto...</p>
                  ) : (
                    <>
                      <Camera size={32} className="text-ink-faint" />
                      <span className="text-sm font-medium">Tirar foto ou escolher da galeria</span>
                      <span className="text-xs text-ink-faint">Toque para abrir a câmera</span>
                    </>
                  )}
                </label>
              )}

              <input
                id={`foto-input-${itemAtualDados.id}`}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFotoCaptura}
                disabled={uploadandoFoto}
                className="hidden"
              />
            </Card>

            {/* Navegação */}
            <div className="flex items-center justify-between gap-4">
              <Button variant="secondary" onClick={voltar} disabled={itemAtual === 0} icon={<ChevronLeft size={18} />}>
                Anterior
              </Button>

              {salvando && <span className="text-xs text-ink-faint">Salvando...</span>}

              {itemAtual === itens.length - 1 ? (
                <button
                  onClick={verificarConclusao}
                  className={`inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white ${totalRespondidos === itens.length ? 'bg-teal' : 'bg-brand'}`}
                >
                  <CheckCircle size={18} />
                  {totalRespondidos === itens.length ? 'Concluir' : 'Finalizar'}
                </button>
              ) : (
                <Button variant="primary" onClick={avancar} icon={<ChevronRight size={18} />} className="flex-row-reverse">
                  Próxima
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
