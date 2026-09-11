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
  Calendar,
  Bell,
  Smartphone,
  History
} from 'lucide-react'
import { calcularAlertaHorario } from '@/lib/prazo-horario'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

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
  foto_url?: string | null
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
  hora_limite?: string | null
}

const labelRecorrencia: Record<string, string> = {
  diaria: '🔄 Diária',
  semanal: '🔄 Semanal',
  mensal: '🔄 Mensal'
}

const STATUS_CONFIG = {
  pendente: { label: 'Pendente', tone: 'warning' as const, cta: 'Iniciar Agora →', ctaBg: 'bg-amber', border: 'border-amber/25' },
  em_andamento: { label: 'Em Andamento', tone: 'info' as const, cta: 'Continuar →', ctaBg: 'bg-blue', border: 'border-blue/25' },
  atrasado: { label: 'Atrasado', tone: 'danger' as const, cta: 'Responder Agora →', ctaBg: 'bg-coral', border: 'border-coral/30' },
  concluido: { label: 'Concluído', tone: 'success' as const, cta: 'Ver Respostas →', ctaBg: 'bg-teal', border: 'border-teal/25' },
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

function ChecklistCard({
  checklist, isNovo, onClick,
}: { checklist: Checklist; isNovo: boolean; onClick: () => void }) {
  const config = STATUS_CONFIG[checklist.status]
  const alertaHorario = checklist.status !== 'concluido' ? calcularAlertaHorario(checklist.hora_limite) : null
  const borderClass = alertaHorario?.nivel === 'vencido' ? 'border-coral/40' : alertaHorario?.nivel === 'proximo' ? 'border-amber/40' : config.border

  return (
    <Card interactive onClick={onClick} className={`border-2 p-6 ${borderClass}`}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="flex-1 text-base font-bold text-ink">{checklist.nome}</h3>
        <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
          {isNovo && <Badge tone="info">🔔 NOVO</Badge>}
          {alertaHorario?.nivel === 'vencido' && <Badge tone="danger">⏰ Prazo vencido</Badge>}
          {alertaHorario?.nivel === 'proximo' && <Badge tone="warning">⏰ {alertaHorario.minutosRestantes} min restantes</Badge>}
          <Badge tone={config.tone}>{config.label}</Badge>
        </div>
      </div>

      {checklist.descricao && <p className="mb-4 text-sm text-ink-muted">{checklist.descricao}</p>}

      {checklist.status === 'em_andamento' && (
        <div className="mb-4 rounded-xl bg-surface-2 p-3">
          <div className="mb-1.5 flex justify-between text-sm">
            <span className="text-ink-muted">Progresso</span>
            <span className="font-semibold text-blue">{checklist.respostas_count}/{checklist.total_perguntas}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-blue transition-[width] duration-300"
              style={{ width: `${(checklist.respostas_count / (checklist.total_perguntas || 1)) * 100}%` }}
            />
          </div>
        </div>
      )}

      {(checklist.status === 'pendente' || checklist.status === 'atrasado') && (
        <div className="flex flex-col gap-1.5 text-sm text-ink-muted">
          <div className="flex items-center gap-2">
            <Calendar size={14} />
            {checklist.proxima_execucao ? `Execução: ${new Date(checklist.proxima_execucao).toLocaleDateString('pt-BR')}` : ''}
          </div>
          {checklist.status === 'pendente' && (checklist.dias_tolerancia ?? 0) > 0 && checklist.proxima_execucao && (
            <div>🕐 {(() => { const j = calcularJanela(checklist.proxima_execucao!, checklist.dias_tolerancia!); return `Disponível: ${j.inicio} – ${j.fim}` })()}</div>
          )}
          {checklist.status === 'pendente' && checklist.hora_limite && (
            <div className={alertaHorario?.nivel ? 'font-semibold text-amber' : ''}>
              ⏰ Responder até {checklist.hora_limite.slice(0, 5)}
            </div>
          )}
          {checklist.recorrencia && checklist.recorrencia !== 'nenhuma' && (
            <Badge tone="info">{labelRecorrencia[checklist.recorrencia] || checklist.recorrencia}</Badge>
          )}
          <div className="flex items-center gap-2">
            <ClipboardList size={14} />
            {checklist.total_perguntas} perguntas
          </div>
        </div>
      )}

      <div className={`mt-4 rounded-xl py-3 text-center text-sm font-semibold text-white ${config.ctaBg}`}>
        {config.cta}
      </div>
    </Card>
  )
}

export default function DashboardColaborador() {
  const router = useRouter()
  const [colaborador, setColaborador] = useState<Colaborador | null>(null)
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [loading, setLoading] = useState(true)
  const [erroChecklists, setErroChecklists] = useState(false)
  const [deferredInstall, setDeferredInstall] = useState<Event | null>(null)
  const [appInstalado, setAppInstalado] = useState(false)
  const [checklistsNovos, setChecklistsNovos] = useState<string[]>([])
  const [notifDescartada, setNotifDescartada] = useState(false)
  const [notifPermissao, setNotifPermissao] = useState<NotificationPermission | 'unsupported'>('default')

  // Força recalcular os alertas de horário limite a cada minuto
  const [, setTick] = useState(0)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPermissao(Notification.permission)
    } else {
      setNotifPermissao('unsupported')
    }
    const intervalo = setInterval(() => setTick(t => t + 1), 60000)
    return () => clearInterval(intervalo)
  }, [])

  async function ativarNotificacoesPrazo() {
    if (!('Notification' in window)) return
    const perm = await Notification.requestPermission()
    setNotifPermissao(perm)
    if (perm === 'granted') {
      new Notification('Performe seu Mercado', {
        body: 'Notificações ativadas! Você será alertado quando o prazo de um checklist estiver próximo.',
        icon: '/logo-semerro.jpg',
      })
    }
  }

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setDeferredInstall(e) }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setAppInstalado(true))
    // Detectar se já está instalado (standalone)
    if (window.matchMedia('(display-mode: standalone)').matches) setAppInstalado(true)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  useEffect(() => {
    console.log('[DASH] useEffect disparado')
    verificarAutenticacao()
  }, [])

  async function verificarAutenticacao() {
    try {
      let user = null

      // 1. Tentar localStorage primeiro (rápido, sem chamada de rede)
      try {
        const userType = localStorage.getItem('userType')
        const userStr = localStorage.getItem('user')
        if (userStr) {
          const parsed = JSON.parse(userStr)
          if (
            parsed.role === 'colaborador' ||
            userType === 'colaborador' ||
            (parsed.empresa_id && parsed.id && !parsed.aluno_id)
          ) {
            user = { ...parsed, role: 'colaborador' }
          }
        }
      } catch { /* ignora erro de localStorage */ }

      // 2. Fallback: verificar sessão no servidor quando localStorage vazio
      if (!user) {
        const res = await fetch('/api/colaborador/sessao')
        if (!res.ok) {
          window.location.href = '/login'
          return
        }
        user = await res.json()
        localStorage.setItem('user', JSON.stringify({ ...user, role: 'colaborador' }))
        localStorage.setItem('userType', 'colaborador')
      }

      setColaborador({
        id: user.id,
        auth_id: user.auth_id,
        nome: user.nome,
        email: user.email,
        cargo: user.cargo,
        empresa_id: user.empresa_id,
        ativo: true,
        foto_url: user.foto_url ?? null,
        empresas: user.empresa_nome ? { nome_fantasia: user.empresa_nome } : undefined
      })

      await carregarChecklists(user.id)
    } catch (error) {
      console.error('[DASH] ERRO inesperado:', error)
      setErroChecklists(true)
      setLoading(false)
    }
  }

  async function carregarChecklists(colaboradorId: string) {
    try {
      setLoading(true)

      const res = await fetch(`/api/colaborador/checklists?colaborador_id=${colaboradorId}`)
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        console.error('[DASH] checklists API erro:', res.status, errData)
        throw new Error(errData.error || `Erro ${res.status} ao carregar checklists`)
      }
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

        // Para recorrentes (diaria/semanal/mensal), o prazo é o fim do período atual,
        // então nunca marcamos como 'atrasado' com base no proxima_execucao original.
        // Apenas checklists sem recorrência usam proxima_execucao + tolerância para atraso.
        if (status !== 'concluido' && checklist.proxima_execucao && (!checklist.recorrencia || checklist.recorrencia === 'nenhuma')) {
          const dataLimite = new Date(checklist.proxima_execucao)
          dataLimite.setDate(dataLimite.getDate() + (checklist.dias_tolerancia || 0))
          dataLimite.setHours(23, 59, 59, 999)
          if (new Date() > dataLimite) status = 'atrasado'
        }

        return { ...checklist, status, total_perguntas: totalPerguntas, respostas_count: respostasCount }
      })

      // Detectar checklists novos desde a última visita
      const chaveVisita = `lastVisit_func_${colaboradorId}`
      const ultimaVisita = localStorage.getItem(chaveVisita)
      const agora = new Date().toISOString()
      if (ultimaVisita) {
        const novos = checklistsData
          .filter(c => c.created_at > ultimaVisita)
          .map(c => c.id)
        setChecklistsNovos(novos)
      }
      localStorage.setItem(chaveVisita, agora)

      setChecklists(checklistsComStatus as Checklist[])
    } catch (error) {
      console.error('Erro ao carregar checklists:', error)
      setErroChecklists(true)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    localStorage.removeItem('user')
    localStorage.removeItem('userType')
    await fetch('/api/colaborador/sessao', { method: 'POST' }).catch(() => {})
    router.push('/login')
  }

  function responderChecklist(checklistId: string) {
    router.push(`/responder-checklist/${checklistId}`)
  }

  const checklistsPendentes = checklists.filter(c => c.status === 'pendente')
  const checklistsEmAndamento = checklists.filter(c => c.status === 'em_andamento')
  const checklistsConcluidos = checklists.filter(c => c.status === 'concluido')
  const checklistsAtrasados = checklists.filter(c => c.status === 'atrasado')

  const checklistsComPrazoProximo = checklists.filter(c => {
    if (c.status === 'concluido') return false
    return calcularAlertaHorario(c.hora_limite)?.nivel === 'proximo'
  })
  const checklistsComPrazoVencidoHoje = checklists.filter(c => {
    if (c.status === 'concluido') return false
    return calcularAlertaHorario(c.hora_limite)?.nivel === 'vencido'
  })

  // Dispara uma notificação do navegador (1x por dia por checklist) quando o prazo estiver próximo
  useEffect(() => {
    if (notifPermissao !== 'granted' || !colaborador) return
    const hoje = new Date().toDateString()
    checklistsComPrazoProximo.forEach(c => {
      const chave = `notif_prazo_${colaborador.id}_${c.id}_${hoje}`
      if (localStorage.getItem(chave)) return
      const alerta = calcularAlertaHorario(c.hora_limite)
      if (!alerta) return
      new Notification(`⏰ Prazo próximo: ${c.nome}`, {
        body: `Responda até ${alerta.horaFormatada} — faltam ${alerta.minutosRestantes} minuto(s).`,
        icon: '/logo-semerro.jpg',
        tag: chave,
      })
      localStorage.setItem(chave, '1')
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checklistsComPrazoProximo.map(c => c.id).join(','), notifPermissao, colaborador])

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1400px] px-6 py-6">

        {/* Top bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white p-4 shadow-soft-sm">
          <div className="flex items-center gap-4">
            {colaborador?.foto_url ? (
              <img
                src={colaborador.foto_url}
                alt={colaborador.nome}
                className="h-14 w-14 cursor-pointer rounded-full border-2 border-surface-2 object-cover"
                onClick={() => router.push('/perfil')}
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
            ) : (
              <div
                className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-brand-tint"
                onClick={() => router.push('/perfil')}
              >
                <User size={26} className="text-brand" />
              </div>
            )}
            <div>
              <h1 className="font-display text-xl font-bold text-ink">Olá, {colaborador?.nome || 'Colaborador'}!</h1>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-muted">
                <Building2 size={14} />
                {colaborador?.empresas?.nome_fantasia}
                {colaborador?.cargo && ` • ${colaborador.cargo}`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Button variant="secondary" onClick={() => router.push('/perfil')} icon={<User size={16} />}>
              Meu Perfil
            </Button>

            {deferredInstall && !appInstalado && (
              <Button
                variant="secondary"
                className="bg-amber-tint text-amber"
                onClick={async () => {
                  const prompt = deferredInstall as any
                  prompt.prompt()
                  const { outcome } = await prompt.userChoice
                  if (outcome === 'accepted') setAppInstalado(true)
                  setDeferredInstall(null)
                }}
                icon={<Smartphone size={16} />}
              >
                Instalar App
              </Button>
            )}

            <Button variant="secondary" onClick={() => router.push('/historico-funcionario')} icon={<History size={16} />}>
              Histórico
            </Button>

            <Button variant="danger" onClick={handleLogout} icon={<LogOut size={16} />}>
              Sair
            </Button>
          </div>
        </div>

        {/* Banner de novos checklists */}
        {!notifDescartada && checklistsNovos.length > 0 && (
          <div className="mb-5 flex items-center justify-between gap-4 rounded-2xl bg-blue-tint p-4">
            <div className="flex items-center gap-3">
              <Bell size={22} className="text-blue" />
              <div>
                <p className="text-sm font-bold text-blue">
                  {checklistsNovos.length === 1 ? 'Você tem 1 novo checklist atribuído!' : `Você tem ${checklistsNovos.length} novos checklists atribuídos!`}
                </p>
                <p className="text-xs text-blue">Confira abaixo os checklists marcados com 🔔 NOVO.</p>
              </div>
            </div>
            <button onClick={() => setNotifDescartada(true)} className="flex-shrink-0 text-lg leading-none text-blue">×</button>
          </div>
        )}

        {/* Banner de prazo por horário próximo ou vencido */}
        {(checklistsComPrazoVencidoHoje.length > 0 || checklistsComPrazoProximo.length > 0) && (
          <div className={`mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-4 ${checklistsComPrazoVencidoHoje.length > 0 ? 'bg-coral-tint' : 'bg-amber-tint'}`}>
            <div className="flex items-center gap-3">
              <Clock size={22} className={checklistsComPrazoVencidoHoje.length > 0 ? 'text-coral' : 'text-amber'} />
              <div>
                <p className={`text-sm font-bold ${checklistsComPrazoVencidoHoje.length > 0 ? 'text-coral' : 'text-amber'}`}>
                  {checklistsComPrazoVencidoHoje.length > 0
                    ? `${checklistsComPrazoVencidoHoje.length} checklist(s) com o prazo de hoje vencido!`
                    : `${checklistsComPrazoProximo.length} checklist(s) com prazo próximo!`}
                </p>
                <p className={`text-xs ${checklistsComPrazoVencidoHoje.length > 0 ? 'text-coral' : 'text-amber'}`}>
                  Confira os checklists com o horário limite destacado abaixo.
                </p>
              </div>
            </div>
            {notifPermissao === 'default' && (
              <Button variant="secondary" size="sm" onClick={ativarNotificacoesPrazo} icon={<Bell size={14} />}>
                Ativar notificações
              </Button>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-tint">
                <ClipboardList size={24} className="text-blue" />
              </div>
              <div>
                <p className="text-sm text-ink-muted">Total de Checklists</p>
                <p className="font-display text-2xl font-bold text-ink">{checklists.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-tint">
                <Clock size={24} className="text-amber" />
              </div>
              <div>
                <p className="text-sm text-ink-muted">Pendentes</p>
                <p className="font-display text-2xl font-bold text-ink">{checklistsPendentes.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-tint">
                <CheckCircle size={24} className="text-teal" />
              </div>
              <div>
                <p className="text-sm text-ink-muted">Concluídos</p>
                <p className="font-display text-2xl font-bold text-ink">{checklistsConcluidos.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Checklists */}
        {loading ? (
          <div className="py-16 text-center text-sm text-ink-muted">Carregando seus checklists...</div>
        ) : erroChecklists ? (
          <Card className="p-8 text-center">
            <p className="mb-4 text-sm text-coral">Não foi possível carregar os checklists. Verifique sua conexão.</p>
            <Button
              variant="primary"
              onClick={() => { setErroChecklists(false); colaborador && carregarChecklists(colaborador.id) }}
            >
              Tentar novamente
            </Button>
          </Card>
        ) : checklists.length === 0 ? (
          <Card className="px-6 py-16 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-tint">
              <ClipboardList size={36} className="text-brand" />
            </div>
            <h3 className="font-display text-xl font-bold text-ink">Nenhum checklist disponível</h3>
            <p className="mt-2 text-sm text-ink-muted">Quando seu gestor atribuir checklists para você, eles aparecerão aqui.</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Pendentes */}
            {checklistsPendentes.length > 0 && (
              <div>
                <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-ink">
                  <Clock size={20} className="text-amber" /> Pendentes ({checklistsPendentes.length})
                </h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {checklistsPendentes.map(checklist => (
                    <ChecklistCard
                      key={checklist.id}
                      checklist={checklist}
                      isNovo={checklistsNovos.includes(checklist.id)}
                      onClick={() => responderChecklist(checklist.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Em Andamento */}
            {checklistsEmAndamento.length > 0 && (
              <div>
                <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-ink">
                  <AlertCircle size={20} className="text-blue" /> Em Andamento ({checklistsEmAndamento.length})
                </h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {checklistsEmAndamento.map(checklist => (
                    <ChecklistCard
                      key={checklist.id}
                      checklist={checklist}
                      isNovo={checklistsNovos.includes(checklist.id)}
                      onClick={() => responderChecklist(checklist.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Atrasados */}
            {checklistsAtrasados.length > 0 && (
              <div>
                <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-ink">
                  <AlertCircle size={20} className="text-coral" /> Atrasados ({checklistsAtrasados.length})
                </h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {checklistsAtrasados.map(checklist => (
                    <ChecklistCard
                      key={checklist.id}
                      checklist={checklist}
                      isNovo={checklistsNovos.includes(checklist.id)}
                      onClick={() => responderChecklist(checklist.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Concluídos */}
            {checklistsConcluidos.length > 0 && (
              <div>
                <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-ink">
                  <CheckCircle size={20} className="text-teal" /> Concluídos ({checklistsConcluidos.length})
                </h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {checklistsConcluidos.map(checklist => (
                    <ChecklistCard
                      key={checklist.id}
                      checklist={checklist}
                      isNovo={false}
                      onClick={() => responderChecklist(checklist.id)}
                    />
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
