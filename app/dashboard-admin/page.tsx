'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckSquare, ChevronDown, Menu, X, LogOut, User, Building2, CheckCircle, XCircle, Users, Search, Clock, AlertTriangle, TrendingUp, UserPlus, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ThemeToggle } from '../../components/ThemeToggle'
import { LanguageToggle } from '../../components/LanguageToggle'
import { FontSizeToggle } from '../../components/FontSizeToggle'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface Aluno {
  id: number
  clientes: string | null
  'e-mail': string | null
  programa: string | null
  ativo: boolean | null
  origem: string | null
}

interface AtividadeRecente {
  tipo: 'checklist' | 'acao'
  descricao: string
  data: string
  cliente?: string
}

interface UsoMensal {
  aluno_id: number
  nome: string
  checklists: number
  acoes: number
  total: number
}

interface Alerta {
  tipo: 'atrasada' | 'sem_atividade'
  nome: string
  detalhe: string
}

export default function DashboardAdmin() {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [userName, setUserName] = useState('')
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [loadingAlunos, setLoadingAlunos] = useState(true)
  const [toggling, setToggling] = useState<number | null>(null)
  const [totalColaboradores, setTotalColaboradores] = useState<number | null>(null)
  const [busca, setBusca] = useState('')
  const [atividades, setAtividades] = useState<AtividadeRecente[]>([])
  const [loadingAtividades, setLoadingAtividades] = useState(true)
  const [usoMensal, setUsoMensal] = useState<UsoMensal[]>([])
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [evolucao, setEvolucao] = useState<{ label: string; checklists: number; acoes: number; novosClientes: number }[]>([])
  const [loadingEvolucao, setLoadingEvolucao] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativo' | 'inativo'>('todos')
  const [filtroOrigem, setFiltroOrigem] = useState<'todos' | 'pagante' | 'programa'>('todos')
  const [enviandoEmail, setEnviandoEmail] = useState(false)
  const [emailResultado, setEmailResultado] = useState<string | null>(null)

  async function carregarAlunos() {
    const { data } = await supabase
      .from('alunos')
      .select('*')
      .order('clientes')
    setAlunos(data || [])
    setLoadingAlunos(false)
  }

  async function carregarColaboradores() {
    try {
      const res = await fetch('/api/admin/colaboradores')
      if (res.ok) {
        const data = await res.json()
        setTotalColaboradores(Array.isArray(data) ? data.length : 0)
      }
    } catch {
      // silencioso
    }
  }

  async function carregarEvolucao() {
    setLoadingEvolucao(true)
    try {
      const res = await fetch('/api/admin/evolucao-mensal')
      if (res.ok) setEvolucao(await res.json())
    } catch { } finally { setLoadingEvolucao(false) }
  }

  async function carregarStats() {
    setLoadingStats(true)
    try {
      const res = await fetch('/api/admin/stats')
      if (!res.ok) return
      const { usoMensal: uso, alertas: als } = await res.json()
      setUsoMensal(uso || [])
      setAlertas(als || [])
    } catch {
      // silencioso
    } finally {
      setLoadingStats(false)
    }
  }

  async function carregarAtividades() {
    setLoadingAtividades(true)
    try {
      const seteAtrasData = new Date()
      seteAtrasData.setDate(seteAtrasData.getDate() - 7)
      const desde = seteAtrasData.toISOString()

      const [clRes, acRes] = await Promise.all([
        supabase
          .from('checklists_futuros')
          .select('id, titulo, status, updated_at, empresas(nome_fantasia)')
          .gte('updated_at', desde)
          .order('updated_at', { ascending: false })
          .limit(5),
        supabase
          .from('acoes_corretivas')
          .select('id, titulo, status, created_at, empresas(nome_fantasia)')
          .gte('created_at', desde)
          .order('created_at', { ascending: false })
          .limit(5),
      ])

      const lista: AtividadeRecente[] = []

      for (const cl of clRes.data || []) {
        const empresa = (cl.empresas as { nome_fantasia: string } | null)?.nome_fantasia
        lista.push({
          tipo: 'checklist',
          descricao: `Checklist "${cl.titulo}" — ${cl.status === 'concluido' ? 'concluído' : cl.status === 'em_andamento' ? 'em andamento' : 'pendente'}`,
          data: cl.updated_at ?? '',
          cliente: empresa,
        })
      }

      for (const ac of acRes.data || []) {
        const empresa = (ac.empresas as { nome_fantasia: string } | null)?.nome_fantasia
        lista.push({
          tipo: 'acao',
          descricao: `Ação "${ac.titulo}" criada`,
          data: ac.created_at ?? '',
          cliente: empresa,
        })
      }

      lista.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      setAtividades(lista.slice(0, 8))
    } catch {
      // silencioso
    } finally {
      setLoadingAtividades(false)
    }
  }

  async function toggleAtivo(aluno: Aluno) {
    setToggling(aluno.id)
    const novoStatus = !aluno.ativo
    try {
      const res = await fetch('/api/admin/clientes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: aluno.id, ativo: novoStatus }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Erro ao atualizar status')
      } else {
        setAlunos((prev) => prev.map((a) => (a.id === aluno.id ? { ...a, ativo: novoStatus } : a)))
        fetch('/api/admin/log-alteracoes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            aluno_id: aluno.id,
            aluno_nome: aluno.clientes || aluno['e-mail'],
            acao: novoStatus ? 'ativado' : 'desativado',
            detalhe: `Cliente ${novoStatus ? 'ativado' : 'desativado'} pelo administrador`,
          }),
        }).catch(() => {})
      }
    } catch {
      alert('Erro ao atualizar status')
    }
    setToggling(null)
  }

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }
    const user = JSON.parse(userData)
    if (user.role !== 'admin') {
      if (user.role === 'colaborador') {
        window.location.href = '/dashboard-funcionario'
      } else {
        window.location.href = '/dashboard-aluno'
      }
      return
    }
    setUserName(user.full_name || user.email)
    carregarAlunos()
    carregarColaboradores()
    carregarAtividades()
    carregarStats()
    carregarEvolucao()
  }, [router])

  const menuItems = [
    {
      title: 'Organização',
      submenu: [
        { label: 'Grupos de Empresa', href: '/organizacao/grupos-empresa' },
        { label: 'Colaboradores', href: '/organizacao/colaboradores' },
        { label: 'Copilotos', href: '/organizacao/copilotos' },
      ]
    },
    {
      title: 'Relatórios',
      submenu: [
        { label: 'Relatórios Gerais', href: '/performance' },
        { label: 'Checklists dos Clientes', href: '/dashboard-admin/checklists' },
        { label: 'Auditoria', href: '/dashboard-admin/auditoria' },
      ]
    },
    {
      title: 'Sistema',
      submenu: [
        { label: 'Usuários', href: '/usuarios' },
        { label: 'Tutorial', href: '/tutorial' },
      ]
    }
  ]

  const handleLogout = async () => {
    localStorage.removeItem('user')
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const alunosFiltrados = alunos.filter((a) => {
    if (filtroStatus === 'ativo' && !a.ativo) return false
    if (filtroStatus === 'inativo' && a.ativo) return false
    if (filtroOrigem !== 'todos' && a.origem !== filtroOrigem) return false
    if (!busca.trim()) return true
    const q = busca.toLowerCase()
    return (
      (a.clientes || '').toLowerCase().includes(q) ||
      (a['e-mail'] || '').toLowerCase().includes(q) ||
      (a.programa || '').toLowerCase().includes(q)
    )
  })

  const totalAtivos = alunos.filter((a) => a.ativo).length
  const totalInativos = alunos.filter((a) => !a.ativo).length
  const totalPagantes = alunos.filter((a) => a.origem === 'pagante').length
  const totalPrograma = alunos.filter((a) => a.origem === 'programa').length
  const pctAtivos = alunos.length > 0 ? Math.round((totalAtivos / alunos.length) * 100) : 0
  const ringCircumference = 2 * Math.PI * 46

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1320px] px-6 py-6">

        <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white p-3 shadow-soft-sm">
          <div className="flex items-center gap-2.5 pl-1.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-coral font-display text-sm font-extrabold text-white shadow-[0_8px_16px_-6px_rgba(255,122,61,0.55)]">
              PM
            </div>
            <span className="font-display text-[15px] font-bold text-ink">
              Performe <span className="font-medium text-ink-faint">seu Mercado — Admin</span>
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
                  <div className="absolute left-0 top-full min-w-[200px] overflow-hidden rounded-2xl bg-white py-1.5 shadow-soft">
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
            <button onClick={() => router.push('/alterar-senha')} className="flex h-9 items-center gap-1.5 rounded-xl bg-surface-2 px-3 text-sm font-semibold text-ink-muted">
              <User size={15} />
              Perfil
            </button>
            <button onClick={handleLogout} className="flex h-9 items-center gap-1.5 rounded-xl bg-coral-tint px-3 text-sm font-semibold text-coral">
              <LogOut size={15} />
              Sair
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
                <button onClick={() => router.push('/alterar-senha')} className="flex-1 rounded-xl bg-surface-2 px-3 py-2 text-sm font-semibold text-ink-muted">
                  Perfil
                </button>
                <button onClick={handleLogout} className="flex-1 rounded-xl bg-coral-tint px-3 py-2 text-sm font-semibold text-coral">
                  Sair
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mb-5 flex flex-wrap items-end justify-between gap-4 px-1">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">Bem-vindo, {userName}!</h1>
            <p className="mt-1 text-sm text-ink-muted">Painel de administração — visão geral das lojas e operações</p>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-[1.3fr_1fr_1fr]">
          <Card className="flex items-center gap-6 p-6">
            <div className="relative h-[108px] w-[108px] flex-shrink-0">
              <svg width="108" height="108" viewBox="0 0 108 108" className="-rotate-90">
                <circle cx="54" cy="54" r="46" fill="none" stroke="var(--color-surface-2)" strokeWidth="12" />
                <circle
                  cx="54" cy="54" r="46" fill="none" stroke="var(--color-teal)" strokeWidth="12" strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringCircumference * (1 - pctAtivos / 100)}
                  style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <b className="font-display text-xl font-bold text-ink">{pctAtivos}%</b>
                <span className="text-[10px] font-bold text-ink-faint">ATIVOS</span>
              </div>
            </div>
            <div>
              <h3 className="mb-1 text-sm font-bold text-ink">Taxa de clientes ativos</h3>
              <p className="mb-2.5 text-xs text-ink-muted">
                <b className="text-ink">{totalAtivos}</b> de <b className="text-ink">{alunos.length}</b> clientes ativos este mês
              </p>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5 text-xs text-ink-muted"><i className="h-2 w-2 rounded-full bg-teal" />Ativos <b className="text-ink">{totalAtivos}</b></div>
                <div className="flex items-center gap-1.5 text-xs text-ink-muted"><i className="h-2 w-2 rounded-full bg-coral" />Inativos <b className="text-ink">{totalInativos}</b></div>
              </div>
            </div>
          </Card>

          <Card interactive className="flex flex-col gap-3.5 p-[18px]" onClick={() => router.push('/organizacao/colaboradores')}>
            <div className="flex items-start justify-between">
              <div className="flex h-[42px] w-[42px] items-center justify-center rounded-2xl bg-violet-tint text-violet">
                <Users size={19} />
              </div>
            </div>
            <div>
              <div className="font-display text-2xl font-bold text-ink">
                {totalColaboradores === null ? <span className="inline-block h-6 w-8 animate-pulse rounded bg-surface-2 align-middle" /> : totalColaboradores}
              </div>
              <div className="text-xs font-medium text-ink-muted">Colaboradores cadastrados</div>
            </div>
          </Card>

          <Card className="flex flex-col gap-3.5 p-[18px]">
            <div className="flex items-start justify-between">
              <div className="flex h-[42px] w-[42px] items-center justify-center rounded-2xl bg-amber-tint text-amber">
                <AlertTriangle size={19} />
              </div>
              {!loadingStats && alertas.length > 0 && <Badge tone="danger">{alertas.length}</Badge>}
            </div>
            <div>
              <div className="font-display text-2xl font-bold text-ink">{loadingStats ? '—' : alertas.length}</div>
              <div className="text-xs font-medium text-ink-muted">Clientes sem atividade</div>
            </div>
          </Card>
        </div>

        <Card className="mb-4 flex flex-wrap p-1.5">
          {[
            { label: 'TOTAL', value: alunos.length, cls: 'text-ink' },
            { label: 'ATIVOS', value: totalAtivos, cls: 'text-teal' },
            { label: 'INATIVOS', value: totalInativos, cls: 'text-coral' },
            { label: 'PAGANTES', value: totalPagantes, cls: 'text-brand' },
            { label: 'PROGRAMA', value: totalPrograma, cls: 'text-violet' },
          ].map((s, i) => (
            <div key={s.label} className={`flex flex-1 flex-col items-center gap-0.5 py-3 ${i > 0 ? 'border-l border-surface-2' : ''}`}>
              <div className={`font-display text-lg font-bold ${s.cls}`}>{s.value}</div>
              <div className="text-[11px] font-bold text-ink-faint">{s.label}</div>
            </div>
          ))}
        </Card>

        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr]">

          <Card>
            <div className="px-5 pb-1 pt-5">
              <h2 className="font-display text-sm font-bold text-ink">Uso no Mês — Top Clientes Ativos</h2>
            </div>
            <div className="p-3.5">
              {loadingStats ? (
                <div className="flex items-center gap-2 p-3 text-sm text-ink-faint">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-surface-2 border-t-teal" />
                  Carregando...
                </div>
              ) : usoMensal.length === 0 ? (
                <div className="py-6 text-center text-ink-faint">
                  <TrendingUp size={30} className="mx-auto mb-2 opacity-35" />
                  <p className="text-sm">Nenhuma atividade este mês</p>
                </div>
              ) : (
                (() => {
                  const maxTotal = Math.max(...usoMensal.map(u => u.total), 1)
                  const barColors = ['bg-teal', 'bg-teal', 'bg-blue', 'bg-blue']
                  return usoMensal.map((item, idx) => {
                    const pct = (item.checklists / maxTotal) * 100
                    const color = item.total === 0 ? 'bg-surface-2' : (barColors[idx] || 'bg-violet')
                    return (
                      <div key={item.aluno_id} className="flex items-center gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-surface-2">
                        <div className={`h-8 w-1.5 flex-shrink-0 self-stretch rounded-full ${color}`} />
                        <div className="min-w-0 flex-1">
                          <div className="mb-1.5 flex items-baseline justify-between gap-2">
                            <span className="truncate text-sm font-semibold text-ink">{item.nome}</span>
                            <span className="whitespace-nowrap text-xs text-ink-muted">
                              <b className="text-ink">{item.checklists}</b> cl. + <b className="text-ink">{item.acoes}</b> ações
                            </span>
                          </div>
                          <div className="relative h-[5px] overflow-hidden rounded-full bg-surface-2">
                            <div className={`absolute inset-y-0 left-0 rounded-full ${color}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    )
                  })
                })()
              )}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between px-5 pb-1 pt-5">
              <h2 className="flex items-center gap-2 font-display text-sm font-bold text-ink">
                Alertas
                {!loadingStats && alertas.length > 0 && <Badge tone="danger">{alertas.length}</Badge>}
              </h2>
              <button
                onClick={async () => {
                  setEnviandoEmail(true)
                  setEmailResultado(null)
                  try {
                    const res = await fetch('/api/admin/enviar-alertas', { method: 'POST' })
                    const data = await res.json()
                    setEmailResultado(data.mensagem || 'E-mails processados.')
                  } catch {
                    setEmailResultado('Erro ao enviar e-mails.')
                  } finally {
                    setEnviandoEmail(false)
                  }
                }}
                disabled={enviandoEmail}
                className="flex items-center gap-1 rounded-lg bg-surface-2 px-3 py-1.5 text-xs font-semibold text-ink-muted disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Mail size={12} />
                {enviandoEmail ? '...' : 'Notificar'}
              </button>
            </div>
            <div className="p-3.5">
              {emailResultado && (
                <div className="mb-2 rounded-xl bg-amber-tint px-3 py-2 text-xs text-amber">
                  {emailResultado}
                </div>
              )}
              {loadingStats ? (
                <div className="flex items-center gap-2 p-3 text-sm text-ink-faint">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-surface-2 border-t-amber" />
                  Carregando...
                </div>
              ) : alertas.length === 0 ? (
                <div className="py-6 text-center text-ink-faint">
                  <CheckCircle size={30} className="mx-auto mb-2 text-teal opacity-70" />
                  <p className="text-sm">Nenhum alerta no momento</p>
                </div>
              ) : (
                <div className="flex max-h-[280px] flex-col overflow-y-auto">
                  {alertas.map((alerta, idx) => (
                    <div key={idx} className="flex items-start gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-surface-2">
                      <div className="h-full min-h-[2.4rem] w-1.5 flex-shrink-0 self-stretch rounded-full bg-amber" />
                      <div>
                        <p className="text-sm font-semibold text-ink">{alerta.nome}</p>
                        <p className="mt-0.5 text-xs text-amber">{alerta.detalhe}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        <Card className="mb-4 overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 px-5 pb-3 pt-5">
            <h2 className="min-w-[180px] flex-1 font-display text-base font-bold text-ink">Clientes / Grupos de Empresa</h2>
            <div className="flex gap-0.5 rounded-xl bg-surface-2 p-1">
              {(['todos', 'ativo', 'inativo'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFiltroStatus(f)}
                  className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    filtroStatus === f ? 'bg-white text-ink shadow-soft-sm' : 'text-ink-muted'
                  }`}
                >
                  {f === 'todos' ? 'Todos' : f === 'ativo' ? 'Ativos' : 'Inativos'}
                </button>
              ))}
            </div>
            <div className="flex gap-0.5 rounded-xl bg-surface-2 p-1">
              {(['todos', 'pagante', 'programa'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFiltroOrigem(f)}
                  className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    filtroOrigem === f ? 'bg-white text-ink shadow-soft-sm' : 'text-ink-muted'
                  }`}
                >
                  {f === 'todos' ? 'Todos' : f === 'pagante' ? 'Pagantes' : 'Programa'}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-[190px] rounded-xl bg-surface-2 py-2 pl-8 pr-3 text-sm outline-none placeholder:text-ink-faint"
              />
            </div>
            <button
              onClick={() => router.push('/dashboard-admin/novo-cliente')}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-brand px-3.5 py-2 text-sm font-semibold text-white shadow-[0_8px_16px_-8px_rgba(255,122,61,0.6)]"
            >
              <UserPlus size={14} /> Novo
            </button>
            <button
              onClick={() => router.push('/organizacao/grupos-empresa')}
              className="whitespace-nowrap rounded-xl bg-surface-2 px-3.5 py-2 text-sm font-semibold text-ink-muted"
            >
              Ver todos
            </button>
          </div>

          {loadingAlunos ? (
            <div className="p-8 text-center text-ink-faint">
              <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-[3px] border-surface-2 border-t-teal" />
              Carregando...
            </div>
          ) : alunosFiltrados.length === 0 ? (
            <div className="p-8 text-center text-ink-faint">
              <CheckSquare size={36} className="mx-auto mb-3 opacity-40" />
              <p>{busca ? `Nenhum cliente encontrado para "${busca}"` : 'Nenhum cliente cadastrado'}</p>
            </div>
          ) : (
            <div className="px-3 pb-4">
              {alunosFiltrados.slice(0, 10).map((aluno) => (
                <div
                  key={aluno.id}
                  className="flex flex-wrap items-center gap-3 rounded-2xl px-2 py-2 transition-colors hover:bg-surface-2"
                  onClick={() => router.push(`/dashboard-admin/cliente/${aluno.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={`h-8 w-1.5 flex-shrink-0 rounded-full ${aluno.origem === 'pagante' ? 'bg-brand' : 'bg-violet'}`} />
                  <div className="min-w-[120px] flex-1">
                    <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                      {aluno.clientes || 'Sem nome'}
                      <Badge tone={aluno.origem === 'pagante' ? 'brand' : 'info'}>
                        {aluno.origem === 'pagante' ? 'Pagante' : 'Programa'}
                      </Badge>
                      <Badge tone={aluno.ativo ? 'success' : 'danger'}>{aluno.ativo ? 'Ativo' : 'Inativo'}</Badge>
                    </p>
                    <p className="text-xs text-ink-muted">{aluno['e-mail'] || ''}{aluno.programa ? ` • ${aluno.programa}` : ''}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleAtivo(aluno) }}
                    disabled={toggling === aluno.id}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-opacity disabled:cursor-not-allowed disabled:opacity-60 ${
                      aluno.ativo ? 'bg-coral-tint text-coral' : 'bg-teal-tint text-teal'
                    }`}
                  >
                    {toggling === aluno.id ? '...' : aluno.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                </div>
              ))}
              {alunosFiltrados.length > 10 && (
                <button
                  onClick={() => router.push('/organizacao/grupos-empresa')}
                  className="mt-2 w-full rounded-2xl bg-surface-2 py-3 text-center text-sm font-semibold text-ink-muted"
                >
                  Ver mais {alunosFiltrados.length - 10} clientes →
                </button>
              )}
            </div>
          )}
        </Card>

        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.2fr]">
          <Card className="p-5">
            <h2 className="mb-2 font-display text-sm font-bold text-ink">Atividade Recente — Últimos 7 dias</h2>

            {loadingAtividades ? (
              <div className="flex items-center gap-2 p-3 text-sm text-ink-faint">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-surface-2 border-t-teal" />
                Carregando atividades...
              </div>
            ) : atividades.length === 0 ? (
              <div className="py-8 text-center text-ink-faint">
                <Clock size={32} className="mx-auto mb-3 opacity-35" />
                <p className="text-sm">Nenhuma atividade nos últimos 7 dias</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {atividades.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-surface-2">
                    <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ${
                      item.tipo === 'checklist' ? 'bg-teal-tint text-teal' : 'bg-brand-tint text-brand'
                    }`}>
                      {item.tipo === 'checklist' ? <CheckSquare size={15} /> : <AlertTriangle size={15} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug text-ink">{item.descricao}</p>
                      {item.cliente && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-faint">
                          <Building2 size={11} />
                          {item.cliente}
                        </p>
                      )}
                    </div>
                    <p className="flex-shrink-0 whitespace-nowrap pt-0.5 text-[11px] font-semibold text-ink-faint">
                      {new Date(item.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="mb-2 font-display text-sm font-bold text-ink">Evolução dos Últimos 6 Meses</h2>
            {loadingEvolucao ? (
              <div className="flex items-center gap-2 p-3 text-sm text-ink-faint">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-surface-2 border-t-teal" />
                Carregando...
              </div>
            ) : (
              <div>
                <div className="flex h-40 items-end gap-3 pb-2 pt-4">
                  {(() => {
                    const maxVal = Math.max(...evolucao.flatMap(e => [e.checklists, e.acoes]), 1)
                    return evolucao.map((mes, idx) => (
                      <div key={idx} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                        <div className="flex w-full items-end justify-center gap-[3px]">
                          <div
                            title={`${mes.checklists} checklists`}
                            className="min-w-[10px] flex-1 rounded-full bg-teal transition-all"
                            style={{ height: `${Math.max((mes.checklists / maxVal) * 130, mes.checklists > 0 ? 6 : 0)}px` }}
                          />
                          <div
                            title={`${mes.acoes} ações`}
                            className="min-w-[10px] flex-1 rounded-full bg-violet transition-all"
                            style={{ height: `${Math.max((mes.acoes / maxVal) * 130, mes.acoes > 0 ? 6 : 0)}px` }}
                          />
                        </div>
                        {mes.novosClientes > 0 && (
                          <span className="text-[0.62rem] font-bold text-brand">+{mes.novosClientes}</span>
                        )}
                        <span className="whitespace-nowrap text-xs text-ink-muted">{mes.label}</span>
                      </div>
                    ))
                  })()}
                </div>
                <div className="mt-2 flex flex-wrap gap-5 border-t border-surface-2 pt-3">
                  {[
                    { dot: 'bg-teal', textCor: 'text-teal', label: 'Checklists', total: evolucao.reduce((s, e) => s + e.checklists, 0) },
                    { dot: 'bg-violet', textCor: 'text-violet', label: 'Ações', total: evolucao.reduce((s, e) => s + e.acoes, 0) },
                    { dot: 'bg-brand', textCor: 'text-brand', label: 'Novos clientes', total: evolucao.reduce((s, e) => s + e.novosClientes, 0) },
                  ].map(item => (
                    <span key={item.label} className="flex items-center gap-1.5 text-sm text-ink-muted">
                      <span className={`h-2.5 w-2.5 rounded-full ${item.dot}`} />
                      {item.label}: <strong className={item.textCor}>{item.total}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
