'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Download, Inbox } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

interface LogEntry {
  id: string
  aluno_id: string
  aluno_nome: string | null
  acao: string
  detalhe: string | null
  created_at: string
}

const ACOES_LABELS: Record<string, string> = {
  ativo_alterado: 'Status alterado',
  cliente_criado: 'Cliente criado',
  cliente_excluido: 'Cliente excluído',
  checklist_criado: 'Checklist criado',
  acao_criada: 'Ação criada',
  acao_concluida: 'Ação concluída',
  login: 'Login',
}

function tonFor(acao: string): 'danger' | 'success' | 'info' {
  if (acao.includes('exclu')) return 'danger'
  if (acao.includes('cria')) return 'success'
  return 'info'
}

const inputClass = 'rounded-xl bg-surface-2 px-3.5 py-2 text-sm outline-none placeholder:text-ink-faint'

export default function AuditoriaPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState({ dataInicio: '', dataFim: '', acao: '', busca: '' })
  const [exportando, setExportando] = useState(false)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limite: '200' })
      if (filtros.dataInicio) params.set('data_inicio', filtros.dataInicio)
      if (filtros.dataFim) params.set('data_fim', filtros.dataFim)
      if (filtros.acao) params.set('acao', filtros.acao)
      const res = await fetch(`/api/admin/log-alteracoes?${params}`)
      if (res.ok) setLogs(await res.json())
    } finally {
      setLoading(false)
    }
  }, [filtros.dataInicio, filtros.dataFim, filtros.acao])

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) { router.push('/login'); return }
    const user = JSON.parse(userData)
    if (user.role !== 'admin') { router.push('/login'); return }
    carregar()
  }, [carregar])

  const logsFiltrados = logs.filter(l => {
    if (!filtros.busca) return true
    const q = filtros.busca.toLowerCase()
    return (l.aluno_nome || '').toLowerCase().includes(q) ||
      (l.detalhe || '').toLowerCase().includes(q) ||
      l.acao.toLowerCase().includes(q)
  })

  function exportarCSV() {
    setExportando(true)
    const linhas = [
      ['Data/Hora', 'Cliente', 'Ação', 'Detalhe'],
      ...logsFiltrados.map(l => [
        new Date(l.created_at).toLocaleString('pt-BR'),
        l.aluno_nome || l.aluno_id,
        ACOES_LABELS[l.acao] || l.acao,
        l.detalhe || '',
      ])
    ]
    const csv = linhas.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `auditoria_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setExportando(false)
  }

  const acoesUnicas = Array.from(new Set(logs.map(l => l.acao))).sort()

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1200px] px-6 py-8">
        <PageHeader
          title="Auditoria do Sistema"
          subtitle="Registro completo de atividades do sistema"
          backHref="/dashboard-admin"
        />

        <Card className="mb-4 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px] flex-1">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                type="text"
                placeholder="Buscar cliente, ação, detalhe..."
                value={filtros.busca}
                onChange={e => setFiltros(f => ({ ...f, busca: e.target.value }))}
                className={`${inputClass} w-full pl-9`}
              />
            </div>
            <select
              value={filtros.acao}
              onChange={e => setFiltros(f => ({ ...f, acao: e.target.value }))}
              className={`${inputClass} cursor-pointer`}
            >
              <option value="">Todos os eventos</option>
              {acoesUnicas.map(a => (
                <option key={a} value={a}>{ACOES_LABELS[a] || a}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-ink-faint">De</span>
              <input type="date" value={filtros.dataInicio}
                onChange={e => setFiltros(f => ({ ...f, dataInicio: e.target.value }))}
                className={inputClass} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-ink-faint">Até</span>
              <input type="date" value={filtros.dataFim}
                onChange={e => setFiltros(f => ({ ...f, dataFim: e.target.value }))}
                className={inputClass} />
            </div>
            <Button variant="primary" onClick={carregar}>Filtrar</Button>
            <Button
              variant="secondary"
              icon={<Download size={14} />}
              onClick={exportarCSV}
              disabled={exportando || logsFiltrados.length === 0}
            >
              {exportando ? 'Exportando...' : 'CSV'}
            </Button>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-sm font-bold text-ink">
              {loading ? 'Carregando...' : `${logsFiltrados.length} registro${logsFiltrados.length !== 1 ? 's' : ''}`}
            </span>
          </div>

          {loading ? (
            <div className="p-16 text-center text-ink-faint">Carregando registros...</div>
          ) : logsFiltrados.length === 0 ? (
            <div className="p-16 text-center">
              <Inbox size={36} className="mx-auto mb-3 text-ink-faint opacity-50" />
              <p className="text-ink-muted">Nenhum registro encontrado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {['Data/Hora', 'Cliente', 'Evento', 'Detalhe'].map(h => (
                      <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-ink-faint">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logsFiltrados.map((log) => (
                    <tr key={log.id} className="transition-colors hover:bg-surface-2">
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-ink-faint">
                        {new Date(log.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-ink">
                        {log.aluno_nome || <span className="italic text-ink-faint">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={tonFor(log.acao)}>{ACOES_LABELS[log.acao] || log.acao}</Badge>
                      </td>
                      <td className="max-w-[360px] px-4 py-3 text-sm text-ink-muted">
                        {log.detalhe || <span className="text-ink-faint">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
