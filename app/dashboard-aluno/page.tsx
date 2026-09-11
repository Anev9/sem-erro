'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckSquare, FileText, ChevronDown, Menu, X, LogOut, User, Calendar, TrendingUp, Building2, Activity, Search, Bell, CheckCircle, AlertTriangle } from 'lucide-react'
import { ThemeToggle } from '../../components/ThemeToggle'
import { LanguageToggle } from '../../components/LanguageToggle'
import { FontSizeToggle } from '../../components/FontSizeToggle'
import { useLang } from '../../contexts/LanguageContext'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface Checklist {
  id: string
  nome: string
  descricao: string | null
  status: string
  created_at: string
  empresa: {
    nome_fantasia: string
  } | null
}

interface PerformanceData {
  empresa: string
  total: number
  concluidos: number
  pendentes: number
  percentual: number
}

function statusInfo(status: string) {
  switch (status) {
    case 'concluido':
      return { tone: 'success' as const, label: 'Concluído', bar: 'bg-teal' }
    case 'ativo':
      return { tone: 'info' as const, label: 'Ativo', bar: 'bg-blue' }
    case 'em_andamento':
      return { tone: 'warning' as const, label: 'Em Andamento', bar: 'bg-amber' }
    case 'pendente':
      return { tone: 'warning' as const, label: 'Pendente', bar: 'bg-amber' }
    default:
      return { tone: 'neutral' as const, label: status, bar: 'bg-surface-2' }
  }
}

function perfColor(pct: number) {
  if (pct >= 70) return { text: 'text-teal', bar: 'bg-teal' }
  if (pct >= 50) return { text: 'text-amber', bar: 'bg-amber' }
  return { text: 'text-coral', bar: 'bg-coral' }
}

export default function DashboardAluno() {
  const router = useRouter()
  const { t, lang } = useLang()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [performance, setPerformance] = useState<PerformanceData[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [alunoId, setAlunoId] = useState<number | null>(null)
  const [feed, setFeed] = useState<Array<{ tipo: string; descricao: string; data: string; checklist?: string }>>([])
  const [loadingFeed, setLoadingFeed] = useState(false)
  const [notifPermissao, setNotifPermissao] = useState<NotificationPermission | 'unsupported'>('default')
  const [resumoSemanal, setResumoSemanal] = useState({ checklistsConcluidos: 0, acoesConcluidas: 0, pendentes: 0, atrasadas: 0 })
  const [fotoUrl, setFotoUrl] = useState<string | null>(null)
  const [buscaQuery, setBuscaQuery] = useState('')
  const [buscaResultados, setBuscaResultados] = useState<{ checklists: Array<{ id: string; titulo: string; empresas?: { nome_fantasia: string }; created_at: string }>; acoes: Array<{ id: string; titulo: string; status: string; empresas?: { nome_fantasia: string } }> } | null>(null)
  const [buscandoGlobal, setBuscandoGlobal] = useState(false)
  const [buscaAberta, setBuscaAberta] = useState(false)

  const menuItems = [
    {
      title: t.nav.acoes,
      submenu: [{ label: t.nav.acoes, href: '/acoes' }]
    },
    {
      title: t.nav.checklist,
      submenu: [
        { label: t.nav.checklistsFuturos, href: '/checklists-futuros' },
        { label: t.nav.checklistsCriados, href: '/checklists-criados' },
        { label: t.nav.uploadChecklist, href: '/upload-questionarios' },
        { label: t.nav.alertasAdicionais, href: '/alertas-adicionais' },
      ]
    },
    {
      title: t.nav.organizacao,
      submenu: [
        { label: t.nav.colaboradores, href: '/colaboradores' },
        { label: t.nav.minhasEmpresas, href: '/minhas-empresas' },
      ]
    },
    {
      title: t.nav.relatorios,
      submenu: [
        { label: t.nav.performanceFuncionarios, href: '/performance-funcionarios' },
        { label: t.nav.respostas, href: '/respostas' },
        { label: t.nav.resultadosChecklist, href: '/resultados-checklist' },
        { label: t.nav.feitosPorEmpresa, href: '/feitos-por-empresa' },
        { label: t.nav.indicador, href: '/indicador' },
        { label: t.nav.feitosPorDepartamento, href: '/feitos-por-departamento' },
      ]
    }
  ]

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }

    const user = JSON.parse(userData)

    // Se for admin, redireciona
    if (user.role === 'admin') {
      router.push('/dashboard-admin')
      return
    }

    setUserName(user.full_name || user.email)
    setAlunoId(user.aluno_id)
    if (user.foto_url) setFotoUrl(user.foto_url)

    // Buscar dados reais se tiver aluno_id
    if (user.aluno_id) {
      buscarDadosReais(user.aluno_id)
      // Buscar foto atualizada do servidor
      fetch('/api/aluno/perfil').then(r => r.ok ? r.json() : null).then(d => {
        if (d?.foto_url) {
          setFotoUrl(d.foto_url)
          // Atualizar localStorage com a foto mais recente
          try {
            const s = localStorage.getItem('user')
            if (s) localStorage.setItem('user', JSON.stringify({ ...JSON.parse(s), foto_url: d.foto_url }))
          } catch {}
        }
      }).catch(() => {})
    } else {
      setLoading(false)
    }
  }, [router])

  async function buscarDadosReais(alunoId: number) {
    try {
      setLoading(true)

      // Busca via API server-side (usa service role para bypassar RLS do aluno)
      const response = await fetch(`/api/aluno/dashboard?aluno_id=${alunoId}`)
      if (!response.ok) {
        console.error('❌ Erro ao buscar dados do dashboard')
        setLoading(false)
        return
      }

      const { empresas, checklists: checklistsData = [], todosChecklists = [] } = await response.json()

      if (!empresas || empresas.length === 0) {
        setLoading(false)
        return
      }

      // Mapear checklists
      const checklistsFormatados = checklistsData.map((item: any) => ({
        id: item.id,
        nome: item.nome,
        descricao: item.descricao,
        status: item.status,
        created_at: item.created_at,
        empresa: item.empresas ? { nome_fantasia: item.empresas.nome_fantasia } : null
      }))
      setChecklists(checklistsFormatados)

      // Verificar prazos apenas 1x por dia
      const hoje = new Date().toDateString()
      const ultimaVerif = localStorage.getItem('ultima-verificacao-prazos')
      if (ultimaVerif !== hoje) {
        verificarPrazos(checklistsFormatados)
        localStorage.setItem('ultima-verificacao-prazos', hoje)
      }

      // Calcular performance
      const performancePorEmpresa: { [key: string]: { total: number; concluidos: number; pendentes: number } } = {}
      empresas.forEach((empresa: any) => {
        performancePorEmpresa[empresa.nome_fantasia] = { total: 0, concluidos: 0, pendentes: 0 }
      })
      todosChecklists.forEach((checklist: any) => {
        const empresa = empresas.find((e: any) => e.id === checklist.empresa_id)
        if (empresa) {
          performancePorEmpresa[empresa.nome_fantasia].total++
          if (checklist.status === 'concluido') {
            performancePorEmpresa[empresa.nome_fantasia].concluidos++
          } else {
            performancePorEmpresa[empresa.nome_fantasia].pendentes++
          }
        }
      })
      const performanceArray: PerformanceData[] = Object.entries(performancePorEmpresa)
        .filter(([_, dados]) => dados.total > 0)
        .map(([empresa, dados]) => ({
          empresa,
          total: dados.total,
          concluidos: dados.concluidos,
          pendentes: dados.pendentes,
          percentual: dados.total > 0 ? Math.round((dados.concluidos / dados.total) * 100) : 0
        }))
      setPerformance(performanceArray)

      // Buscar feed de atividades
      setLoadingFeed(true)
      const feedRes = await fetch('/api/aluno/feed')
      if (feedRes.ok) setFeed(await feedRes.json())
      setLoadingFeed(false)

      // Calcular resumo semanal a partir dos dados carregados
      const inicioSemana = new Date()
      inicioSemana.setDate(inicioSemana.getDate() - 7)
      inicioSemana.setHours(0, 0, 0, 0)
      const clConcluidos = checklistsFormatados.filter((c: Checklist) => c.status === 'concluido' && new Date(c.created_at) >= inicioSemana).length
      const clPendentes = checklistsFormatados.filter((c: Checklist) => c.status !== 'concluido').length
      setResumoSemanal({ checklistsConcluidos: clConcluidos, acoesConcluidas: 0, pendentes: clPendentes, atrasadas: 0 })

      // Verificar permissão de notificações
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setNotifPermissao(Notification.permission)
      } else {
        setNotifPermissao('unsupported')
      }

    } catch (error) {
      console.error('❌ Erro geral:', error)
    } finally {
      setLoading(false)
    }
  }

  async function buscarGlobal(q: string) {
    if (q.length < 2) { setBuscaResultados(null); return }
    setBuscandoGlobal(true)
    try {
      const res = await fetch(`/api/aluno/busca?q=${encodeURIComponent(q)}`)
      if (res.ok) setBuscaResultados(await res.json())
    } finally {
      setBuscandoGlobal(false)
    }
  }

  async function ativarNotificacoes() {
    if (!('Notification' in window)) return
    const perm = await Notification.requestPermission()
    setNotifPermissao(perm)
    if (perm === 'granted') {
      new Notification('Performe seu Mercado', {
        body: 'Notificações ativadas! Você será alertado sobre prazos de checklists.',
        icon: '/logo-semerro.jpg',
      })
    }
  }

  function verificarPrazos(checklistsData: Checklist[]) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    checklistsData.forEach(cl => {
      if (cl.status === 'concluido') return
      // Checklist não concluído e criado há mais de 7 dias
      const criado = new Date(cl.created_at)
      const diffDias = Math.round((hoje.getTime() - criado.getTime()) / 86400000)
      if (diffDias >= 7) {
        new Notification(`Checklist pendente: ${cl.nome}`, {
          body: `Checklist da empresa ${cl.empresa?.nome_fantasia || 'desconhecida'} está pendente há ${diffDias} dia(s).`,
          icon: '/logo-semerro.jpg',
          tag: `checklist-${cl.id}`,
        })
      }
    })
  }

  function formatarData(data: string) {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const handleLogout = async () => {
    localStorage.removeItem('user')
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const totalPerfChecklists = performance.reduce((acc, item) => acc + item.total, 0)
  const taxaMediaConclusao = performance.length > 0 ? Math.round(performance.reduce((acc, item) => acc + item.percentual, 0) / performance.length) : 0

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1320px] px-6 py-6">

        {/* Top bar */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white p-3 shadow-soft-sm">
          <div className="flex items-center gap-2.5 pl-1.5">
            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl shadow-[0_8px_16px_-6px_rgba(255,122,61,0.55)]">
              <img src="/logo-semerro.jpg" alt="Performe seu Mercado" className="h-full w-full object-cover" />
            </div>
            <span className="font-display text-[15px] font-bold text-ink">
              Performe <span className="font-medium text-ink-faint">seu Mercado</span>
            </span>
          </div>

          <div className="hidden items-center gap-1 rounded-2xl bg-surface-2 p-1 md:flex">
            {menuItems.map((item) => (
              <div
                key={item.title}
                className="relative"
                onMouseEnter={() => setActiveDropdown(item.title)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  onClick={() => router.push(item.submenu[0].href)}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                    activeDropdown === item.title ? 'bg-brand text-white shadow-[0_6px_14px_-6px_rgba(255,122,61,0.65)]' : 'text-ink-muted'
                  }`}
                >
                  {item.title}
                  <ChevronDown size={14} />
                </button>

                {activeDropdown === item.title && (
                  <div className="absolute left-0 top-full z-[500] min-w-[210px] overflow-hidden rounded-2xl bg-white py-1.5 shadow-soft">
                    {item.submenu.map((sub) => (
                      <button
                        key={sub.label}
                        onClick={() => router.push(sub.href)}
                        className="block w-full px-4 py-2.5 text-left text-sm font-medium text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <FontSizeToggle />
            <LanguageToggle variant="light" />
            <ThemeToggle variant="light" />
            <button onClick={() => router.push('/perfil-aluno')} className="flex h-9 items-center gap-1.5 rounded-xl bg-surface-2 px-3 text-sm font-semibold text-ink-muted">
              {fotoUrl ? (
                <img src={fotoUrl} alt="Perfil" className="h-5 w-5 flex-shrink-0 rounded-full object-cover" />
              ) : (
                <User size={15} />
              )}
              {t.nav.perfil}
            </button>
            <button onClick={handleLogout} className="flex h-9 items-center gap-1.5 rounded-xl bg-coral-tint px-3 text-sm font-semibold text-coral">
              <LogOut size={15} />
              {t.nav.sair}
            </button>
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-ink md:hidden">
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {mobileMenuOpen && (
            <div className="w-full border-t border-surface-2 pt-3 md:hidden">
              {menuItems.map((item) => (
                <div key={item.title} className="mt-2">
                  <div className="px-2 py-1.5 text-sm font-bold text-ink">{item.title}</div>
                  {item.submenu.map((sub) => (
                    <button
                      key={sub.label}
                      onClick={() => { router.push(sub.href); setMobileMenuOpen(false) }}
                      className="block w-full px-6 py-2 text-left text-sm text-ink-muted"
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              ))}
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-surface-2 pt-3">
                <FontSizeToggle />
                <LanguageToggle variant="light" />
                <ThemeToggle variant="light" />
                <button onClick={() => router.push('/perfil-aluno')} className="flex-1 rounded-xl bg-surface-2 px-3 py-2 text-sm font-semibold text-ink-muted">
                  {t.nav.perfil}
                </button>
                <button onClick={handleLogout} className="flex-1 rounded-xl bg-coral-tint px-3 py-2 text-sm font-semibold text-coral">
                  {t.nav.sair}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Welcome + busca global */}
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4 px-1">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">{t.dashboard.welcome}, {userName}!</h1>
            <p className="mt-1 text-sm text-ink-muted">Painel do Cliente</p>
          </div>

          <div className="relative w-full sm:w-[320px]">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              type="text"
              value={buscaQuery}
              placeholder="Buscar checklists, ações..."
              onChange={e => { setBuscaQuery(e.target.value); setBuscaAberta(true); buscarGlobal(e.target.value) }}
              onFocus={() => setBuscaAberta(true)}
              onBlur={() => setTimeout(() => setBuscaAberta(false), 200)}
              className="w-full rounded-xl bg-surface-2 py-2.5 pl-8 pr-3 text-sm outline-none placeholder:text-ink-faint"
            />
            {buscandoGlobal && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-faint">...</span>
            )}

            {buscaAberta && buscaResultados && (buscaResultados.checklists.length > 0 || buscaResultados.acoes.length > 0) && (
              <div className="absolute right-0 top-[110%] z-[500] max-h-[360px] w-full min-w-[280px] overflow-y-auto overflow-x-hidden rounded-2xl bg-white shadow-soft">
                {buscaResultados.checklists.length > 0 && (
                  <div>
                    <div className="bg-violet-tint px-3.5 py-2 text-[11px] font-bold uppercase tracking-wide text-violet">Checklists</div>
                    {buscaResultados.checklists.map(cl => (
                      <button
                        key={cl.id}
                        onClick={() => { router.push(`/checklists-futuros`); setBuscaAberta(false); setBuscaQuery('') }}
                        className="block w-full border-b border-surface-2 px-4 py-2.5 text-left transition-colors last:border-0 hover:bg-surface-2"
                      >
                        <span className="block truncate text-sm font-semibold text-ink">{cl.titulo}</span>
                        {cl.empresas && <span className="mt-0.5 flex items-center gap-1 text-xs text-ink-faint"><Building2 size={11} />{cl.empresas.nome_fantasia}</span>}
                      </button>
                    ))}
                  </div>
                )}
                {buscaResultados.acoes.length > 0 && (
                  <div>
                    <div className="bg-blue-tint px-3.5 py-2 text-[11px] font-bold uppercase tracking-wide text-blue">Ações Corretivas</div>
                    {buscaResultados.acoes.map(ac => (
                      <button
                        key={ac.id}
                        onClick={() => { router.push(`/acoes`); setBuscaAberta(false); setBuscaQuery('') }}
                        className="block w-full border-b border-surface-2 px-4 py-2.5 text-left transition-colors last:border-0 hover:bg-surface-2"
                      >
                        <span className="block truncate text-sm font-semibold text-ink">{ac.titulo}</span>
                        {ac.empresas && <span className="mt-0.5 flex items-center gap-1 text-xs text-ink-faint"><Building2 size={11} />{ac.empresas.nome_fantasia} · {ac.status}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {buscaAberta && buscaQuery.length >= 2 && !buscandoGlobal && buscaResultados && buscaResultados.checklists.length === 0 && buscaResultados.acoes.length === 0 && (
              <div className="absolute right-0 top-[110%] z-[500] w-full min-w-[280px] rounded-2xl bg-white p-5 text-center text-sm text-ink-faint shadow-soft">
                Nenhum resultado encontrado.
              </div>
            )}
          </div>
        </div>

        {/* Banner de notificações push */}
        {notifPermissao === 'default' && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-blue-tint px-5 py-4 shadow-soft-sm">
            <div className="flex items-center gap-3">
              <Bell size={18} className="flex-shrink-0 text-blue" />
              <p className="text-sm text-blue">{t.dashboard.notifBannerMsg}</p>
            </div>
            <button
              onClick={ativarNotificacoes}
              className="whitespace-nowrap rounded-xl bg-blue px-4 py-2 text-sm font-semibold text-white"
            >
              {t.dashboard.enableNotifications}
            </button>
          </div>
        )}

        {/* Resumo semanal */}
        {!loading && (
          <Card className="mb-4 p-5">
            <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-display text-sm font-bold text-ink">
                <TrendingUp size={16} className="text-ink-muted" />
                Resumo dos Últimos 7 Dias
              </h2>
              <button
                onClick={() => router.push('/dashboard-empresa')}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-surface-2 px-3.5 py-2 text-xs font-semibold text-ink-muted"
              >
                <Building2 size={13} />
                Dashboard por Empresa
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-teal-tint p-4">
                <div className="mb-1 flex items-center gap-1.5 text-xs font-bold text-teal">
                  <CheckCircle size={14} />
                  Checklists concluídos
                </div>
                <div className="font-display text-2xl font-bold text-teal">{resumoSemanal.checklistsConcluidos}</div>
              </div>
              <div className={`rounded-2xl p-4 ${resumoSemanal.pendentes > 0 ? 'bg-amber-tint' : 'bg-teal-tint'}`}>
                <div className={`mb-1 flex items-center gap-1.5 text-xs font-bold ${resumoSemanal.pendentes > 0 ? 'text-amber' : 'text-teal'}`}>
                  <FileText size={14} />
                  Checklists pendentes
                </div>
                <div className={`font-display text-2xl font-bold ${resumoSemanal.pendentes > 0 ? 'text-amber' : 'text-teal'}`}>{resumoSemanal.pendentes}</div>
              </div>
            </div>
          </Card>
        )}

        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr]">

          {/* Checklists dos últimos 30 dias */}
          <Card>
            <div className="px-5 pb-1 pt-5">
              <h2 className="font-display text-sm font-bold text-ink">Checklists dos Últimos 30 Dias</h2>
            </div>
            <div className="max-h-[440px] overflow-y-auto p-3.5">
              {loading ? (
                <div className="flex items-center gap-2 p-3 text-sm text-ink-faint">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-surface-2 border-t-violet" />
                  {t.common.loading}
                </div>
              ) : checklists.length === 0 ? (
                <div className="py-8 text-center text-ink-faint">
                  <CheckSquare size={32} className="mx-auto mb-3 opacity-35" />
                  <p className="text-sm font-medium">Nenhum checklist encontrado</p>
                  <p className="mt-1 text-xs">Os checklists aparecerão aqui quando forem criados</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {checklists.map((checklist) => {
                    const info = statusInfo(checklist.status)
                    return (
                      <div
                        key={checklist.id}
                        onClick={() => router.push(`/checklists-criados/${checklist.id}`)}
                        className="flex cursor-pointer items-start gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-surface-2"
                      >
                        <div className={`min-h-[2.6rem] w-1.5 flex-shrink-0 self-stretch rounded-full ${info.bar}`} />
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-semibold text-ink">{checklist.nome}</span>
                            <Badge tone={info.tone}>{info.label}</Badge>
                          </div>
                          {checklist.descricao && (
                            <p className="mb-1 line-clamp-2 text-xs text-ink-muted">{checklist.descricao}</p>
                          )}
                          <div className="flex flex-wrap gap-3 text-[11px] text-ink-faint">
                            {checklist.empresa?.nome_fantasia && (
                              <span className="flex items-center gap-1"><Building2 size={11} />{checklist.empresa.nome_fantasia}</span>
                            )}
                            <span className="flex items-center gap-1"><Calendar size={11} />{formatarData(checklist.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </Card>

          {/* Performance por empresa */}
          <Card>
            <div className="px-5 pb-1 pt-5">
              <h2 className="font-display text-sm font-bold text-ink">{t.dashboard.performance}</h2>
            </div>
            <div className="p-3.5">
              {loading ? (
                <div className="flex items-center gap-2 p-3 text-sm text-ink-faint">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-surface-2 border-t-violet" />
                  {t.common.loading}
                </div>
              ) : performance.length === 0 ? (
                <div className="py-8 text-center text-ink-faint">
                  <FileText size={32} className="mx-auto mb-3 opacity-35" />
                  <p className="text-sm font-medium">Nenhum dado disponível</p>
                  <p className="mt-1 text-xs">Os dados aparecerão quando houver checklists</p>
                </div>
              ) : (
                <>
                  {performance.map((item) => {
                    const color = perfColor(item.percentual)
                    return (
                      <div key={item.empresa} className="rounded-2xl px-2 py-2.5 transition-colors hover:bg-surface-2">
                        <div className="mb-1.5 flex items-baseline justify-between gap-2">
                          <span className="truncate text-sm font-semibold text-ink">{item.empresa}</span>
                          <span className={`whitespace-nowrap text-sm font-bold ${color.text}`}>{item.percentual}%</span>
                        </div>
                        <div className="relative h-[5px] overflow-hidden rounded-full bg-surface-2">
                          <div className={`absolute inset-y-0 left-0 rounded-full ${color.bar}`} style={{ width: `${item.percentual}%` }} />
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-3 text-[11px] text-ink-muted">
                          <span>Total: <b className="text-ink">{item.total}</b></span>
                          <span className="text-teal">✓ {item.concluidos}</span>
                          <span className="text-amber">⏳ {item.pendentes}</span>
                        </div>
                      </div>
                    )
                  })}

                  <div className="mt-2 rounded-2xl bg-violet-tint px-4 py-3">
                    <div className="mb-1 flex items-center gap-1.5 text-xs font-bold text-violet">
                      <TrendingUp size={13} />
                      Resumo Geral
                    </div>
                    <p className="text-xs text-ink-muted">
                      Categorias: <b className="text-ink">{performance.length}</b> · Checklists: <b className="text-ink">{totalPerfChecklists}</b> · Taxa média: <b className="text-ink">{taxaMediaConclusao}%</b>
                    </p>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>

        {/* Feed de atividades */}
        <Card className="p-5">
          <h2 className="mb-2 flex items-center gap-2 font-display text-sm font-bold text-ink">
            <Activity size={16} className="text-ink-muted" />
            {t.dashboard.recentActivity}
          </h2>
          {loadingFeed ? (
            <div className="flex items-center gap-2 p-3 text-sm text-ink-faint">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-surface-2 border-t-violet" />
              {t.common.loading}
            </div>
          ) : feed.length === 0 ? (
            <div className="py-8 text-center text-ink-faint">
              <Activity size={32} className="mx-auto mb-3 opacity-35" />
              <p className="text-sm">{t.dashboard.noActivity}</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {feed.map((item, idx) => {
                const isChecklist = item.tipo === 'checklist'
                const isAcao = item.tipo === 'acao'
                const iconCls = isChecklist ? 'bg-teal-tint text-teal' : isAcao ? 'bg-brand-tint text-brand' : 'bg-violet-tint text-violet'
                return (
                  <div key={idx} className="flex items-start gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-surface-2">
                    <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ${iconCls}`}>
                      {isChecklist ? <CheckSquare size={15} /> : isAcao ? <AlertTriangle size={15} /> : <Bell size={15} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug text-ink">{item.descricao}</p>
                      <p className="mt-0.5 text-[11px] text-ink-faint">
                        {new Date(item.data).toLocaleDateString(lang === 'en' ? 'en-US' : 'pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {item.checklist && (
                      <button
                        onClick={() => router.push(`/checklists-criados/${item.checklist}`)}
                        className="flex-shrink-0 whitespace-nowrap pt-0.5 text-xs font-semibold text-violet"
                      >
                        {t.dashboard.viewMore}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </Card>

      </div>
    </div>
  )
}
