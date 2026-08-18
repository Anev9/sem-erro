'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Plus, Search, CheckCircle, XCircle, Pencil, Building2, CalendarX } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

interface Aluno {
  id: number
  programa: string | null
  clientes: string | null
  nome_aluno: string | null
  'e-mail': string | null
  telefone: string | null
  tipo: string | null
  ativo: boolean | null
  cidade: string | null
  estado: string | null
  cnpj: string | null
  created_at: string | null
  data_saida: string | null
  origem: string | null
}

export default function GruposEmpresaPage() {
  const router = useRouter()
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [ativoFilter, setAtivoFilter] = useState('todas')
  const [origemFilter, setOrigemFilter] = useState('todas')
  const [ordenacao, setOrdenacao] = useState('nome')

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) { router.push('/login'); return }
    const user = JSON.parse(userData)
    if (user.role !== 'admin') { router.push('/login'); return }
    buscarAlunos()
  }, [router])

  async function buscarAlunos() {
    const { data, error } = await supabase
      .from('alunos')
      .select('*')
      .order('clientes', { ascending: true })
    if (!error) setAlunos(data || [])
    setLoading(false)
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
      if (res.ok) {
        setAlunos((prev) => prev.map((a) => (a.id === aluno.id ? { ...a, ativo: novoStatus } : a)))
      } else {
        const data = await res.json()
        alert(data.error || 'Erro ao atualizar status')
      }
    } catch {
      alert('Erro ao atualizar status')
    }
    setToggling(null)
  }

  function exportarCSV() {
    // Aspas duplas em cada célula + escape interno (RFC 4180)
    const cel = (v: string | number) => '"' + String(v).replace(/"/g, '""') + '"'

    const headers = ['ID', 'Nome', 'Nome do Aluno', 'Origem', 'Programa', 'Status', 'Email', 'Telefone', 'CNPJ', 'Tipo de Empresa', 'Cidade', 'Estado', 'Data de Cadastro', 'Data de Saída']
    const rows = alunosFiltrados.map((a) => [
      cel(a.id),
      cel(a.clientes || ''),
      cel(a.nome_aluno || ''),
      cel(a.origem === 'pagante' ? 'Pagante' : 'Programa'),
      cel(a.programa || ''),
      cel(a.ativo ? 'Ativo' : 'Inativo'),
      cel(a['e-mail'] || ''),
      cel(a.telefone || ''),
      cel(a.cnpj || ''),
      cel(a.tipo || ''),
      cel(a.cidade || ''),
      cel(a.estado || ''),
      cel(a.created_at ? new Date(a.created_at).toLocaleDateString('pt-BR') : ''),
      cel(a.data_saida ? new Date(a.data_saida).toLocaleDateString('pt-BR') : ''),
    ])

    // Separador ponto-e-vírgula (padrão Excel pt-BR) + CRLF entre linhas
    const csv = [headers.map(cel), ...rows].map((row) => row.join(';')).join('\r\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'grupos-empresa-' + new Date().toISOString().split('T')[0] + '.csv'
    link.click()
    window.URL.revokeObjectURL(url)
  }

  function aplicarOrdenacao(lista: Aluno[]) {
    const copia = [...lista]
    if (ordenacao === 'nome') return copia.sort((a, b) => (a.clientes || '').localeCompare(b.clientes || ''))
    if (ordenacao === 'programa') return copia.sort((a, b) => (a.programa || '').localeCompare(b.programa || ''))
    return copia.sort((a, b) => new Date(b.created_at ?? '').getTime() - new Date(a.created_at ?? '').getTime())
  }

  const alunosFiltrados = aplicarOrdenacao(
    alunos.filter((aluno) => {
      const s = searchTerm.toLowerCase()
      const matchSearch =
        (aluno.clientes || '').toLowerCase().includes(s) ||
        (aluno.nome_aluno || '').toLowerCase().includes(s) ||
        (aluno.programa || '').toLowerCase().includes(s) ||
        (aluno['e-mail'] || '').toLowerCase().includes(s) ||
        (aluno.cidade || '').toLowerCase().includes(s)
      const matchAtivo =
        ativoFilter === 'todas' ||
        (ativoFilter === 'ativas' && aluno.ativo === true) ||
        (ativoFilter === 'inativas' && aluno.ativo === false)
      const matchOrigem = origemFilter === 'todas' || aluno.origem === origemFilter
      return matchSearch && matchAtivo && matchOrigem
    })
  )

  const totalAtivos = alunos.filter((a) => a.ativo).length
  const totalInativos = alunos.filter((a) => !a.ativo).length
  const totalPagantes = alunos.filter((a) => a.origem === 'pagante').length

  const statCards = [
    { label: 'Total de Clientes', value: alunos.length, valueClass: 'text-ink' },
    { label: 'Ativos', value: totalAtivos, valueClass: 'text-teal' },
    { label: 'Inativos', value: totalInativos, valueClass: 'text-coral' },
    { label: 'Pagantes', value: totalPagantes, valueClass: 'text-brand' },
  ]

  const statusPills = [
    { value: 'todas', label: 'Todos', count: alunos.length },
    { value: 'ativas', label: 'Ativos', count: totalAtivos },
    { value: 'inativas', label: 'Inativos', count: totalInativos },
  ]

  const origemPills = [
    { value: 'todas', label: 'Todos' },
    { value: 'pagante', label: 'Pagante' },
    { value: 'programa', label: 'Programa' },
  ]

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1600px] px-6 py-8">
        <PageHeader
          title="Grupos de Empresas"
          subtitle={`${alunosFiltrados.length} resultado${alunosFiltrados.length !== 1 ? 's' : ''}`}
          backHref="/dashboard-admin"
          actions={
            <>
              <Button variant="primary" icon={<Plus size={16} />} onClick={() => router.push('/organizacao/grupos-empresa/criar')}>
                Criar novo
              </Button>
              <Button variant="secondary" icon={<Download size={16} />} onClick={exportarCSV}>
                Exportar CSV
              </Button>
            </>
          }
        />

        <div className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
          {statCards.map((card) => (
            <Card key={card.label} className="p-4">
              <p className="mb-1.5 text-sm text-ink-muted">{card.label}</p>
              <p className={`font-display text-2xl font-bold ${card.valueClass}`}>{card.value}</p>
            </Card>
          ))}
        </div>

        <Card className="overflow-hidden">
          <div className="p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              <div className="relative min-w-[220px] flex-1">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input
                  type="text"
                  placeholder="Buscar por nome, aluno, programa, email ou cidade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl bg-surface-2 py-2 pl-9 pr-8 text-sm outline-none placeholder:text-ink-faint"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-ink-faint hover:text-ink"
                  >×</button>
                )}
              </div>
              <select
                value={ordenacao}
                onChange={(e) => setOrdenacao(e.target.value)}
                className="min-w-[170px] cursor-pointer rounded-xl bg-surface-2 px-3 py-2 text-sm text-ink-muted outline-none"
              >
                <option value="nome">Ordenar por nome</option>
                <option value="programa">Ordenar por programa</option>
                <option value="data">Ordenar por data</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs text-ink-faint">Status:</span>
              {statusPills.map((opt) => {
                const active = ativoFilter === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => setAtivoFilter(opt.value)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-colors ${
                      active ? 'bg-brand font-bold text-white' : 'bg-surface-2 font-medium text-ink-muted'
                    }`}
                  >
                    {opt.label}
                    <span className={active ? 'text-white/70' : 'text-ink-faint'}>{opt.count}</span>
                  </button>
                )
              })}
              <span className="ml-3 mr-1 text-xs text-ink-faint">Origem:</span>
              {origemPills.map((opt) => {
                const active = origemFilter === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => setOrigemFilter(opt.value)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-colors ${
                      active ? 'bg-brand font-bold text-white' : 'bg-surface-2 font-medium text-ink-muted'
                    }`}
                  >
                    {opt.label}
                  </button>
                )
              })}
              {(searchTerm || ativoFilter !== 'todas' || origemFilter !== 'todas') && (
                <button
                  onClick={() => { setSearchTerm(''); setAtivoFilter('todas'); setOrigemFilter('todas') }}
                  className="ml-2 cursor-pointer rounded-full px-2.5 py-1 text-xs text-ink-faint hover:text-ink-muted"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-ink-faint">Carregando...</div>
          ) : alunosFiltrados.length === 0 ? (
            <div className="py-16 text-center text-ink-faint">
              <Building2 size={36} className="mx-auto mb-3 opacity-30" />
              Nenhum resultado encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {['Status', 'Nome', 'Aluno', 'Origem', 'Programa', 'Email', 'Localização', 'Telefone', 'Data de Saída', 'Ações'].map((h) => (
                      <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-ink-faint">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {alunosFiltrados.map((aluno) => (
                    <tr key={aluno.id} className="transition-colors hover:bg-surface-2">
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge tone={aluno.ativo ? 'success' : 'danger'}>
                          {aluno.ativo ? <><CheckCircle size={12} /> Ativo</> : <><XCircle size={12} /> Inativo</>}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-ink">
                          {aluno.clientes || <em className="text-ink-faint">Sem nome</em>}
                        </span>
                        {aluno.cnpj && <p className="mt-0.5 text-xs text-ink-faint">{aluno.cnpj}</p>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-muted">
                        {aluno.nome_aluno || <span className="text-ink-faint">—</span>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge tone={aluno.origem === 'pagante' ? 'brand' : 'info'}>
                          {aluno.origem === 'pagante' ? 'Pagante' : 'Programa'}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-muted">
                        {aluno.programa || <span className="text-ink-faint">—</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-ink-muted">
                        {aluno['e-mail'] || <span className="text-ink-faint">—</span>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-muted">
                        {aluno.cidade && aluno.estado
                          ? `${aluno.cidade} / ${aluno.estado}`
                          : aluno.cidade || aluno.estado || <span className="text-ink-faint">—</span>
                        }
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-muted">
                        {aluno.telefone || <span className="text-ink-faint">—</span>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {aluno.data_saida ? (
                          <Badge tone="danger">
                            <CalendarX size={12} />
                            {new Date(aluno.data_saida).toLocaleDateString('pt-BR')}
                          </Badge>
                        ) : (
                          <span className="text-sm text-ink-faint">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleAtivo(aluno)}
                            disabled={toggling === aluno.id}
                            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-opacity disabled:cursor-not-allowed disabled:opacity-60 ${
                              aluno.ativo ? 'bg-coral-tint text-coral' : 'bg-teal-tint text-teal'
                            }`}
                          >
                            {toggling === aluno.id
                              ? '...'
                              : aluno.ativo
                                ? <><XCircle size={13} /> Desativar</>
                                : <><CheckCircle size={13} /> Ativar</>
                            }
                          </button>
                          <button
                            onClick={() => router.push(`/organizacao/grupos-empresa/editar/${aluno.id}`)}
                            className="flex items-center gap-1 rounded-lg bg-surface-2 px-2.5 py-1.5 text-xs font-semibold text-ink-muted hover:text-ink"
                          >
                            <Pencil size={13} /> Editar
                          </button>
                        </div>
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
