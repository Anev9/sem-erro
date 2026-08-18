'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, UserCheck, UserX, Building2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

interface Colaborador {
  id: string
  nome: string
  email: string
  cargo: string
  celular: string | null
  ativo: boolean
  created_at: string
  empresas: { nome_fantasia: string } | null
}

export default function ColaboradoresAdminPage() {
  const router = useRouter()
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [ativoFilter, setAtivoFilter] = useState('todos')

  useEffect(() => {
    fetch('/api/admin/colaboradores')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setColaboradores(data)
      })
      .finally(() => setLoading(false))
  }, [])

  const filtrados = colaboradores.filter((c) => {
    const search = searchTerm.toLowerCase()
    const matchSearch =
      c.nome.toLowerCase().includes(search) ||
      c.email.toLowerCase().includes(search) ||
      (c.cargo || '').toLowerCase().includes(search) ||
      (c.empresas?.nome_fantasia || '').toLowerCase().includes(search)

    const matchAtivo =
      ativoFilter === 'todos' ||
      (ativoFilter === 'ativos' && c.ativo) ||
      (ativoFilter === 'inativos' && !c.ativo)

    return matchSearch && matchAtivo
  })

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1400px] px-6 py-8">
        <PageHeader
          title="Colaboradores"
          subtitle={`${colaboradores.length} colaborador${colaboradores.length !== 1 ? 'es' : ''} cadastrado${colaboradores.length !== 1 ? 's' : ''}`}
          backHref="/dashboard-admin"
          actions={
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => router.push('/organizacao/colaboradores/criar')}
            >
              Novo Colaborador
            </Button>
          }
        />

        <Card className="p-6">
          <div className="mb-5 flex flex-wrap gap-3">
            <div className="relative min-w-[240px] flex-1">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                type="text"
                placeholder="Buscar por nome, email, cargo ou empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl bg-surface-2 py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-ink-faint"
              />
            </div>
            <select
              value={ativoFilter}
              onChange={(e) => setAtivoFilter(e.target.value)}
              className="cursor-pointer rounded-xl bg-surface-2 px-3 py-2.5 text-sm outline-none"
            >
              <option value="todos">Todos</option>
              <option value="ativos">Apenas ativos</option>
              <option value="inativos">Apenas inativos</option>
            </select>
          </div>

          {loading ? (
            <div className="py-12 text-center text-ink-faint">Carregando...</div>
          ) : filtrados.length === 0 ? (
            <div className="py-12 text-center text-ink-faint">
              {searchTerm || ativoFilter !== 'todos' ? 'Nenhum colaborador encontrado para esse filtro.' : 'Nenhum colaborador cadastrado ainda.'}
            </div>
          ) : (
            <div className="grid gap-2">
              {filtrados.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-wrap items-center gap-4 rounded-2xl bg-surface-2 px-5 py-4"
                >
                  <div
                    className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full ${
                      c.ativo ? 'bg-teal-tint' : 'bg-coral-tint'
                    }`}
                  >
                    {c.ativo
                      ? <UserCheck size={20} className="text-teal" />
                      : <UserX size={20} className="text-coral" />
                    }
                  </div>

                  <div className="min-w-[180px] flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-ink">{c.nome}</span>
                      <Badge tone={c.ativo ? 'success' : 'danger'}>{c.ativo ? 'Ativo' : 'Inativo'}</Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-ink-muted">
                      {c.cargo} • {c.email}
                    </p>
                    {c.celular && (
                      <p className="mt-0.5 text-xs text-ink-faint">{c.celular}</p>
                    )}
                  </div>

                  {c.empresas && (
                    <div className="flex items-center gap-1.5 text-sm text-ink-muted">
                      <Building2 size={15} className="text-ink-faint" />
                      {c.empresas.nome_fantasia}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
