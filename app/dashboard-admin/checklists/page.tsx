'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ClipboardList } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface Aluno {
  id: number
  nome: string | null
}

interface ChecklistStatus {
  id: string
  titulo: string | null
  status: string
  progresso: number
  empresa_id: string | null
  empresa_nome: string
  aluno_id: number | null
  aluno_nome: string
  colaborador_nome: string
  concluido_por_nome: string | null
  concluido_em: string | null
  proxima_execucao: string | null
  data_inicio: string | null
  data_fim: string | null
  updated_at: string | null
}

const STATUS_INFO: Record<string, { tone: 'success' | 'info' | 'warning' | 'danger'; label: string }> = {
  concluido: { tone: 'success', label: 'Concluído' },
  em_andamento: { tone: 'info', label: 'Em Andamento' },
  pendente: { tone: 'warning', label: 'Pendente' },
  atrasado: { tone: 'danger', label: 'Atrasado' },
}

function statusInfo(status: string): { tone: 'success' | 'info' | 'warning' | 'danger'; label: string } {
  return STATUS_INFO[status] || { tone: 'info', label: status }
}

function formatarData(data: string | null) {
  if (!data) return '—'
  return new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const inputClass = 'rounded-xl bg-surface-2 px-3.5 py-2 text-sm outline-none placeholder:text-ink-faint'

export default function ChecklistsAdminPage() {
  const router = useRouter()
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [checklists, setChecklists] = useState<ChecklistStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroAluno, setFiltroAluno] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [busca, setBusca] = useState('')

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroAluno) params.set('aluno_id', filtroAluno)
      if (filtroStatus) params.set('status', filtroStatus)
      const res = await fetch(`/api/admin/checklists-status?${params}`)
      if (res.ok) {
        const data = await res.json()
        setAlunos(data.alunos || [])
        setChecklists(data.checklists || [])
      }
    } finally {
      setLoading(false)
    }
  }, [filtroAluno, filtroStatus])

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) { router.push('/login'); return }
    const user = JSON.parse(userData)
    if (user.role !== 'admin') { router.push('/login'); return }
    carregar()
  }, [carregar, router])

  const checklistsFiltrados = checklists.filter((c) => {
    if (!busca.trim()) return true
    const q = busca.toLowerCase()
    return (
      (c.titulo || '').toLowerCase().includes(q) ||
      c.aluno_nome.toLowerCase().includes(q) ||
      c.empresa_nome.toLowerCase().includes(q) ||
      c.colaborador_nome.toLowerCase().includes(q)
    )
  })

  const total = checklistsFiltrados.length
  const concluidos = checklistsFiltrados.filter((c) => c.status === 'concluido').length
  const emAndamento = checklistsFiltrados.filter((c) => c.status === 'em_andamento').length
  const pendentes = checklistsFiltrados.filter((c) => c.status === 'pendente').length
  const atrasados = checklistsFiltrados.filter((c) => c.status === 'atrasado').length

  const stats = [
    { label: 'Total', value: total, cls: 'text-ink' },
    { label: 'Concluídos', value: concluidos, cls: 'text-teal' },
    { label: 'Em Andamento', value: emAndamento, cls: 'text-blue' },
    { label: 'Pendentes', value: pendentes, cls: 'text-amber' },
    { label: 'Atrasados', value: atrasados, cls: 'text-coral' },
  ]

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1300px] px-6 py-8">
        <PageHeader
          title="Acompanhamento de Checklists"
          subtitle="Veja quem preencheu, status e progresso"
          backHref="/dashboard-admin"
        />

        <div className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
          {stats.map((s) => (
            <Card key={s.label} className="p-4">
              <p className="text-xs font-semibold text-ink-muted">{s.label}</p>
              <p className={`mt-1 font-display text-2xl font-bold ${s.cls}`}>{s.value}</p>
            </Card>
          ))}
        </div>

        <Card className="mb-4 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                type="text"
                placeholder="Buscar checklist, cliente, empresa, responsável..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className={`${inputClass} w-full pl-9`}
              />
            </div>
            <select value={filtroAluno} onChange={(e) => setFiltroAluno(e.target.value)} className={`${inputClass} cursor-pointer`}>
              <option value="">Todos os clientes</option>
              {alunos.map((a) => (
                <option key={a.id} value={a.id}>{a.nome || `Cliente #${a.id}`}</option>
              ))}
            </select>
            <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className={`${inputClass} cursor-pointer`}>
              <option value="">Todos os status</option>
              <option value="pendente">Pendente</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="concluido">Concluído</option>
              <option value="atrasado">Atrasado</option>
            </select>
          </div>
        </Card>

        <Card className="overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-ink-faint">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-[3px] border-surface-2 border-t-teal" />
              Carregando...
            </div>
          ) : checklistsFiltrados.length === 0 ? (
            <div className="p-12 text-center text-ink-faint">
              <ClipboardList size={36} className="mx-auto mb-3 opacity-30" />
              Nenhum checklist encontrado com os filtros selecionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {['Cliente', 'Empresa', 'Checklist', 'Responsável', 'Status', 'Progresso', 'Atualizado em'].map((h) => (
                      <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-ink-faint">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {checklistsFiltrados.map((c) => {
                    const info = statusInfo(c.status)
                    return (
                      <tr key={c.id} className="transition-colors hover:bg-surface-2">
                        <td className="px-4 py-3 text-sm font-semibold text-ink">{c.aluno_nome}</td>
                        <td className="px-4 py-3 text-sm text-ink-muted">{c.empresa_nome}</td>
                        <td className="px-4 py-3 text-sm text-ink-muted">{c.titulo || 'Sem título'}</td>
                        <td className="px-4 py-3 text-sm text-ink-muted">
                          {c.status === 'concluido' && c.concluido_por_nome ? c.concluido_por_nome : c.colaborador_nome}
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={info.tone}>{info.label}</Badge>
                        </td>
                        <td className="min-w-[120px] px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                              <div className={`h-full rounded-full ${c.progresso >= 100 ? 'bg-teal' : 'bg-blue'}`} style={{ width: `${c.progresso}%` }} />
                            </div>
                            <span className="text-xs font-semibold text-ink-muted">{c.progresso}%</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-ink-faint">
                          {c.status === 'concluido' ? formatarData(c.concluido_em) : formatarData(c.updated_at)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
