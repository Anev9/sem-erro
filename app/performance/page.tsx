'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TrendingUp, Building2, CheckSquare, AlertTriangle, Search, Download, Printer } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

interface ClientePerformance {
  aluno_id: number
  nome: string
  email: string | null
  ativo: boolean
  ultimo_login: string | null
  empresas: number
  checklists: { total: number; concluidos: number; mes: number }
  acoes: { total: number; concluidas: number; atrasadas: number; mes: number }
}

const inputClass = 'rounded-xl bg-surface-2 px-3.5 py-2 text-sm outline-none placeholder:text-ink-faint'

export default function PerformancePage() {
  const router = useRouter()
  const [dados, setDados] = useState<ClientePerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [ordenacao, setOrdenacao] = useState<'nome' | 'checklists' | 'acoes' | 'atrasadas'>('nome')
  const [filtroAtivo, setFiltroAtivo] = useState<'todos' | 'ativo' | 'inativo'>('todos')

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) { router.push('/login'); return }
    const user = JSON.parse(userData)
    if (user.role !== 'admin') { router.push('/login'); return }
    carregarDados()
  }, [router])

  async function carregarDados() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/stats')
      if (!res.ok) return
      const { performanceGeral } = await res.json()
      setDados(performanceGeral || [])
    } catch {
      // silencioso
    } finally {
      setLoading(false)
    }
  }

  const dadosFiltrados = dados
    .filter(d => {
      if (filtroAtivo === 'ativo' && !d.ativo) return false
      if (filtroAtivo === 'inativo' && d.ativo) return false
      if (busca.trim()) {
        const q = busca.toLowerCase()
        return d.nome.toLowerCase().includes(q) || (d.email || '').toLowerCase().includes(q)
      }
      return true
    })
    .sort((a, b) => {
      if (ordenacao === 'nome') return a.nome.localeCompare(b.nome)
      if (ordenacao === 'checklists') return b.checklists.total - a.checklists.total
      if (ordenacao === 'acoes') return b.acoes.total - a.acoes.total
      if (ordenacao === 'atrasadas') return b.acoes.atrasadas - a.acoes.atrasadas
      return 0
    })

  const totais = {
    clientes: dados.length,
    ativos: dados.filter(d => d.ativo).length,
    checklistsTotal: dados.reduce((s, d) => s + d.checklists.total, 0),
    acoesMes: dados.reduce((s, d) => s + d.acoes.mes, 0),
    atrasadasTotal: dados.reduce((s, d) => s + d.acoes.atrasadas, 0),
  }

  function calcPct(valor: number, total: number) {
    if (!total) return 0
    return Math.round((valor / total) * 100)
  }

  function formatarUltimoLogin(data: string | null) {
    if (!data) return '—'
    const d = new Date(data)
    const agora = new Date()
    const diffDias = Math.floor((agora.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDias === 0) return 'Hoje'
    if (diffDias === 1) return 'Ontem'
    if (diffDias < 7) return `${diffDias} dias atrás`
    return d.toLocaleDateString('pt-BR')
  }

  function exportarCSV() {
    const headers = ['Cliente', 'E-mail', 'Status', 'Empresas', 'Checklists Total', 'Checklists Concluídos', 'Checklists Mês', 'Ações Total', 'Ações Concluídas', 'Ações Atrasadas', 'Ações Mês', 'Último Login']
    const rows = dadosFiltrados.map(d => [
      d.nome,
      d.email || '',
      d.ativo ? 'Ativo' : 'Inativo',
      d.empresas,
      d.checklists.total,
      d.checklists.concluidos,
      d.checklists.mes,
      d.acoes.total,
      d.acoes.concluidas,
      d.acoes.atrasadas,
      d.acoes.mes,
      d.ultimo_login ? new Date(d.ultimo_login).toLocaleDateString('pt-BR') : '—',
    ])
    const csv = [headers, ...rows].map(r => r.join(';')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `performance-clientes-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const stats = [
    { label: 'Total de Clientes', value: totais.clientes, cls: 'text-ink' },
    { label: 'Clientes Ativos', value: totais.ativos, cls: 'text-teal' },
    { label: 'Checklists Criados', value: totais.checklistsTotal, cls: 'text-violet' },
    { label: 'Ações este Mês', value: totais.acoesMes, cls: 'text-blue' },
    { label: 'Ações Atrasadas', value: totais.atrasadasTotal, cls: 'text-coral' },
  ]

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1400px] px-6 py-8">
        <PageHeader
          title="Relatório de Performance"
          subtitle="Uso, checklists e ações por cliente"
          backHref="/dashboard-admin"
        />

        <div className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
          {stats.map(s => (
            <Card key={s.label} className="p-4">
              <p className="text-xs font-semibold text-ink-muted">{s.label}</p>
              <p className={`mt-1 font-display text-2xl font-bold ${s.cls}`}>{s.value}</p>
            </Card>
          ))}
        </div>

        <Card className="mb-4 flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                className={`${inputClass} w-[200px] pl-9`}
              />
            </div>

            <div className="flex gap-0.5 rounded-xl bg-surface-2 p-1">
              {(['todos', 'ativo', 'inativo'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFiltroAtivo(f)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    filtroAtivo === f ? 'bg-white text-ink shadow-soft-sm' : 'text-ink-muted'
                  }`}
                >
                  {f === 'todos' ? 'Todos' : f === 'ativo' ? 'Ativos' : 'Inativos'}
                </button>
              ))}
            </div>

            <select
              value={ordenacao}
              onChange={e => setOrdenacao(e.target.value as typeof ordenacao)}
              className={`${inputClass} cursor-pointer`}
            >
              <option value="nome">Ordenar: Nome</option>
              <option value="checklists">Ordenar: + Checklists</option>
              <option value="acoes">Ordenar: + Ações</option>
              <option value="atrasadas">Ordenar: + Atrasadas</option>
            </select>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" icon={<Download size={14} />} onClick={exportarCSV}>CSV</Button>
            <Button variant="primary" icon={<Printer size={14} />} onClick={() => window.print()}>PDF</Button>
          </div>
        </Card>

        <Card className="overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-ink-faint">
              <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-[3px] border-surface-2 border-t-teal" />
              Carregando dados...
            </div>
          ) : dadosFiltrados.length === 0 ? (
            <div className="p-16 text-center text-ink-faint">
              <TrendingUp size={40} className="mx-auto mb-4 opacity-30" />
              <p>Nenhum cliente encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {['Cliente', 'Status', 'Empresas', 'Checklists', '% Concluído', 'Ações', 'Atrasadas', 'Atividade Mês', 'Último Login'].map(h => (
                      <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-ink-faint">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dadosFiltrados.map((d) => {
                    const pctChecklist = calcPct(d.checklists.concluidos, d.checklists.total)
                    const atividadeMes = d.checklists.mes + d.acoes.mes
                    const pctTone = pctChecklist >= 70 ? 'text-teal' : pctChecklist >= 40 ? 'text-amber' : 'text-coral'
                    const pctBar = pctChecklist >= 70 ? 'bg-teal' : pctChecklist >= 40 ? 'bg-amber' : 'bg-coral'
                    return (
                      <tr
                        key={d.aluno_id}
                        onClick={() => router.push(`/dashboard-admin/cliente/${d.aluno_id}`)}
                        className="cursor-pointer transition-colors hover:bg-surface-2"
                      >
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-blue">{d.nome}</p>
                          {d.email && <p className="text-xs text-ink-faint">{d.email}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={d.ativo ? 'success' : 'danger'}>{d.ativo ? 'Ativo' : 'Inativo'}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Building2 size={14} className="text-ink-faint" />
                            <span className="text-sm font-semibold text-ink-muted">{d.empresas}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <CheckSquare size={14} className="text-violet" />
                            <span className="text-sm font-semibold text-ink-muted">{d.checklists.total}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 min-w-[60px] flex-1 overflow-hidden rounded-full bg-surface-2">
                              <div className={`h-full rounded-full ${pctBar}`} style={{ width: `${pctChecklist}%` }} />
                            </div>
                            <span className={`min-w-[32px] text-xs font-bold ${pctTone}`}>{pctChecklist}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-ink-muted">{d.acoes.total}</td>
                        <td className="px-4 py-3">
                          {d.acoes.atrasadas > 0 ? (
                            <div className="flex items-center gap-1">
                              <AlertTriangle size={14} className="text-coral" />
                              <span className="text-sm font-bold text-coral">{d.acoes.atrasadas}</span>
                            </div>
                          ) : (
                            <span className="text-sm font-semibold text-teal">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={atividadeMes > 0 ? 'info' : 'neutral'}>
                            {atividadeMes > 0 ? `${atividadeMes} itens` : 'Sem atividade'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-ink-muted">{formatarUltimoLogin(d.ultimo_login)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <p className="mt-4 text-center text-xs text-ink-faint">
          {dadosFiltrados.length} cliente{dadosFiltrados.length !== 1 ? 's' : ''} exibido{dadosFiltrados.length !== 1 ? 's' : ''}
        </p>
      </div>

      <style>{`
        @media print {
          nav, button, .no-print { display: none !important; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  )
}
