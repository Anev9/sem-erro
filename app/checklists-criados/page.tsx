'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Calendar, Building2, FileCheck, Eye, User, Copy, Loader2, Pencil } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

interface ChecklistCriado {
  id: string
  nome: string
  descricao?: string
  status: 'pendente' | 'em_andamento' | 'concluido'
  data_inicio: string
  data_fim: string
  created_at: string
  empresas?: { nome_fantasia: string }
  colaboradores?: { nome: string }
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

export default function ChecklistsCriados() {
  const router = useRouter()
  const [checklists, setChecklists] = useState<ChecklistCriado[]>([])
  const [loading, setLoading] = useState(true)
  const [duplicandoId, setDuplicandoId] = useState<string | null>(null)
  const [empresas, setEmpresas] = useState<{ id: string; nome_fantasia: string }[]>([])
  const [filtros, setFiltros] = useState({
    empresa_id: '',
    dataInicio: '',
    dataFim: '',
    status: ''
  })

  useEffect(() => {
    verificarAutenticacao()
  }, [])

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
      const res = await fetch(`/api/aluno/checklists-criados?aluno_id=${alunoId}`)
      if (!res.ok) throw new Error('Erro ao carregar dados')
      const { empresas: emp, checklists: cl } = await res.json()
      setEmpresas(emp || [])
      setChecklists(cl || [])
    } catch (err) {
      console.error('Erro ao carregar checklists:', err)
    } finally {
      setLoading(false)
    }
  }

  async function duplicarChecklist(id: string) {
    setDuplicandoId(id)
    try {
      const res = await fetch('/api/aluno/checklists-criados/duplicar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checklist_id: id }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Erro ao duplicar')
      const { nome } = await res.json()
      toast.success(`Checklist duplicado: "${nome}"`)
      const userStr = localStorage.getItem('user')
      if (userStr) await carregarDados(JSON.parse(userStr).id)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao duplicar checklist')
    } finally {
      setDuplicandoId(null)
    }
  }

  const checklistsFiltrados = checklists.filter(c => {
    if (filtros.empresa_id && c.empresas?.nome_fantasia) {
      const empresa = empresas.find(e => e.id === filtros.empresa_id)
      if (empresa && c.empresas.nome_fantasia !== empresa.nome_fantasia) return false
    }
    if (filtros.status && c.status !== filtros.status) return false
    if (filtros.dataInicio && new Date(c.created_at) < new Date(filtros.dataInicio)) return false
    if (filtros.dataFim) {
      const fim = new Date(filtros.dataFim)
      fim.setHours(23, 59, 59, 999)
      if (new Date(c.created_at) > fim) return false
    }
    return true
  })

  const formatarData = (data: string) => new Date(data).toLocaleDateString('pt-BR')

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1320px] px-6 py-8">
        <PageHeader
          title="Checklists Criados"
          subtitle="Visualize e acompanhe todos os checklists cadastrados"
          backHref="/dashboard-aluno"
        />

        {/* Filtros */}
        <Card className="mb-5 p-6">
          <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-muted">Empresa</label>
              <div className="relative">
                <Building2 size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                <select
                  value={filtros.empresa_id}
                  onChange={(e) => setFiltros({ ...filtros, empresa_id: e.target.value })}
                  className="w-full cursor-pointer rounded-xl bg-surface-2 py-2.5 pl-9 pr-3 text-sm outline-none"
                >
                  <option value="">Todas as empresas</option>
                  {empresas.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.nome_fantasia}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-muted">Status</label>
              <select
                value={filtros.status}
                onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
                className="w-full cursor-pointer rounded-xl bg-surface-2 px-3 py-2.5 text-sm outline-none"
              >
                <option value="">Todos os status</option>
                <option value="pendente">Pendente</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="concluido">Concluído</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-muted">A partir de</label>
              <div className="relative">
                <Calendar size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input
                  type="date"
                  value={filtros.dataInicio}
                  onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
                  className="w-full rounded-xl bg-surface-2 py-2.5 pl-9 pr-3 text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-muted">Até</label>
              <div className="relative">
                <Calendar size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input
                  type="date"
                  value={filtros.dataFim}
                  onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
                  className="w-full rounded-xl bg-surface-2 py-2.5 pl-9 pr-3 text-sm outline-none"
                />
              </div>
            </div>

            <Button
              variant="secondary"
              onClick={() => setFiltros({ empresa_id: '', dataInicio: '', dataFim: '', status: '' })}
            >
              Limpar filtros
            </Button>
          </div>

          <p className="mt-4 text-sm italic text-ink-faint">
            {checklistsFiltrados.length} checklist{checklistsFiltrados.length !== 1 ? 's' : ''} encontrado{checklistsFiltrados.length !== 1 ? 's' : ''}
          </p>
        </Card>

        {/* Lista */}
        {loading ? (
          <Card className="p-12 text-center text-ink-faint">Carregando checklists...</Card>
        ) : checklistsFiltrados.length === 0 ? (
          <Card className="px-6 py-16 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-tint">
              <FileCheck size={36} className="text-brand" />
            </div>
            <h2 className="font-display text-xl font-bold text-ink">Nenhum checklist encontrado</h2>
            <p className="mt-2 text-sm text-ink-muted">
              {checklists.length === 0 ? 'Nenhum checklist foi criado ainda.' : 'Nenhum checklist corresponde aos filtros selecionados.'}
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {checklistsFiltrados.map((checklist) => (
              <Card key={checklist.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="min-w-[280px] flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
                    <h3 className="text-base font-bold text-ink">{checklist.nome}</h3>
                    <Badge tone={statusTone[checklist.status]}>{statusLabel[checklist.status]}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-ink-muted">
                    {checklist.empresas && (
                      <span className="flex items-center gap-1.5">
                        <Building2 size={14} />
                        {checklist.empresas.nome_fantasia}
                      </span>
                    )}
                    {checklist.colaboradores && (
                      <span className="flex items-center gap-1.5">
                        <User size={14} />
                        {checklist.colaboradores.nome}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      Até {formatarData(checklist.data_fim)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <Button
                    variant="secondary"
                    onClick={() => duplicarChecklist(checklist.id)}
                    disabled={duplicandoId === checklist.id}
                    icon={duplicandoId === checklist.id ? <Loader2 size={16} className="animate-spin" /> : <Copy size={16} />}
                  >
                    Duplicar
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => router.push(`/checklists-futuros/editar/${checklist.id}`)}
                    icon={<Pencil size={16} />}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => router.push(`/checklists-criados/${checklist.id}`)}
                    icon={<Eye size={16} />}
                  >
                    Ver Detalhes
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
