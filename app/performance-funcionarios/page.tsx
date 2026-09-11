'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, ChevronDown, ChevronUp } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface ColaboradorStats {
  nome: string
  empresa: string
  total: number
  conformes: number
  naoConformes: number
  naAplicavel: number
  performance: number
}

function perfTone(perf: number) {
  if (perf >= 90) return { text: 'text-teal', bg: 'bg-teal-tint', bar: 'bg-teal' }
  if (perf >= 75) return { text: 'text-blue', bg: 'bg-blue-tint', bar: 'bg-blue' }
  return { text: 'text-amber', bg: 'bg-amber-tint', bar: 'bg-amber' }
}

export default function PerformanceColaboradores() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [colaboradores, setColaboradores] = useState<ColaboradorStats[]>([])
  const [busca, setBusca] = useState('')
  const [expandido, setExpandido] = useState<string | null>(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) { router.push('/login'); return }
    const user = JSON.parse(userData)
    if (user.role !== 'aluno') { router.push('/login'); return }
    carregarDados(user.id || user.aluno_id)
  }, [router])

  async function carregarDados(alunoId: string | number) {
    try {
      setLoading(true)
      setErro('')
      const res = await fetch(`/api/aluno/respostas?aluno_id=${alunoId}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Erro ${res.status} ao carregar dados`)
      }
      const { respostas } = await res.json()

      const mapa: Record<string, ColaboradorStats> = {}

      for (const r of (respostas || [])) {
        const nome = r.responsavel || ''
        if (!nome || nome === '-') continue

        if (!mapa[nome]) {
          mapa[nome] = { nome, empresa: r.empresa || '', total: 0, conformes: 0, naoConformes: 0, naAplicavel: 0, performance: 0 }
        }

        mapa[nome].total++
        if (r.resultado === 'conforme') mapa[nome].conformes++
        else if (r.resultado === 'nao_conforme') mapa[nome].naoConformes++
        else mapa[nome].naAplicavel++
      }

      const lista = Object.values(mapa).map(c => {
        const validas = c.conformes + c.naoConformes
        c.performance = validas > 0 ? Math.round((c.conformes / validas) * 100) : 0
        return c
      }).sort((a, b) => b.performance - a.performance)

      setColaboradores(lista)
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao carregar dados'
      console.error('[performance-funcionarios]', msg)
      setErro(msg)
    } finally {
      setLoading(false)
    }
  }

  const filtrados = colaboradores.filter(c =>
    busca === '' || c.nome.toLowerCase().includes(busca.toLowerCase())
  )

  const totalRespostas = colaboradores.reduce((acc, c) => acc + c.total, 0)
  const mediaPerf = colaboradores.length > 0
    ? Math.round(colaboradores.reduce((acc, c) => acc + c.performance, 0) / colaboradores.length)
    : 0
  const excelentes = colaboradores.filter(c => c.performance >= 90).length

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1200px] px-6 py-8">
        <PageHeader
          title="Performance de Colaboradores"
          subtitle="Desempenho da equipe com base nas respostas dos checklists"
          backHref="/dashboard-aluno"
        />

        <Card className="p-6 sm:p-8">
          {loading ? (
            <p className="py-12 text-center text-sm text-ink-muted">Carregando dados...</p>
          ) : erro ? (
            <div className="py-12 text-center">
              <p className="mb-1.5 font-semibold text-coral">Erro ao carregar dados</p>
              <p className="text-sm text-ink-muted">{erro}</p>
              <Button
                variant="primary"
                className="mt-4"
                onClick={() => {
                  const userData = localStorage.getItem('user')
                  if (userData) {
                    const user = JSON.parse(userData)
                    carregarDados(user.id || user.aluno_id)
                  }
                }}
              >
                Tentar novamente
              </Button>
            </div>
          ) : colaboradores.length === 0 ? (
            <div className="py-16 text-center">
              <Users size={48} className="mx-auto mb-4 text-ink-faint" />
              <p className="text-sm text-ink-muted">
                Nenhum dado disponível ainda.<br />
                Os dados aparecem conforme os colaboradores respondem checklists.
              </p>
            </div>
          ) : (
            <>
              {/* Resumo */}
              <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-2xl bg-brand-tint p-5">
                  <p className="mb-1.5 text-xs font-semibold text-brand">Colaboradores</p>
                  <p className="font-display text-3xl font-bold text-brand">{colaboradores.length}</p>
                </div>
                <div className="rounded-2xl bg-teal-tint p-5">
                  <p className="mb-1.5 text-xs font-semibold text-teal">Média Geral</p>
                  <p className="font-display text-3xl font-bold text-teal">{mediaPerf}%</p>
                </div>
                <div className="rounded-2xl bg-blue-tint p-5">
                  <p className="mb-1.5 text-xs font-semibold text-blue">Total Respostas</p>
                  <p className="font-display text-3xl font-bold text-blue">{totalRespostas}</p>
                </div>
                <div className="rounded-2xl bg-amber-tint p-5">
                  <p className="mb-1.5 text-xs font-semibold text-amber">Excelentes (≥90%)</p>
                  <p className="font-display text-3xl font-bold text-amber">{excelentes}</p>
                </div>
              </div>

              {/* Busca */}
              <input
                type="text"
                placeholder="Buscar por nome..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="mb-6 w-full rounded-xl bg-surface-2 px-3.5 py-2.5 text-sm outline-none"
              />

              {/* Ranking */}
              <div className="flex flex-col gap-3">
                {filtrados.map((c, i) => {
                  const tone = perfTone(c.performance)
                  const medalha = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`

                  return (
                    <div key={c.nome} className="overflow-hidden rounded-2xl bg-surface-2">
                      <div className="p-5">
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="min-w-[2.5rem] text-center text-xl">{medalha}</div>

                          <div className="min-w-[180px] flex-1">
                            <h3 className="text-base font-bold text-ink">{c.nome}</h3>
                            <p className="text-sm text-ink-muted">{c.empresa}</p>
                          </div>

                          <div className="flex gap-5">
                            <div className="text-center">
                              <p className="mb-0.5 text-[11px] text-ink-faint">Total</p>
                              <p className="text-lg font-bold text-ink-muted">{c.total}</p>
                            </div>
                            <div className="text-center">
                              <p className="mb-0.5 text-[11px] text-teal">Conformes</p>
                              <p className="text-lg font-bold text-teal">{c.conformes}</p>
                            </div>
                            <div className="text-center">
                              <p className="mb-0.5 text-[11px] text-coral">Não Conf.</p>
                              <p className="text-lg font-bold text-coral">{c.naoConformes}</p>
                            </div>
                          </div>

                          <div className={`min-w-[80px] rounded-xl px-5 py-3 text-center ${tone.bg}`}>
                            <p className={`text-2xl font-bold leading-none ${tone.text}`}>{c.performance}%</p>
                            <p className="mt-1 text-[11px] text-ink-muted">conformidade</p>
                          </div>

                          <button
                            onClick={() => setExpandido(expandido === c.nome ? null : c.nome)}
                            className="p-1 text-ink-faint"
                          >
                            {expandido === c.nome ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </button>
                        </div>

                        <div className="mt-4">
                          <div className="mb-1.5 flex justify-between text-xs text-ink-muted">
                            <span>Taxa de conformidade</span><span>{c.performance}%</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-white">
                            <div className={`h-full rounded-full transition-[width] duration-500 ${tone.bar}`} style={{ width: `${c.performance}%` }} />
                          </div>
                        </div>
                      </div>

                      {expandido === c.nome && (
                        <div className="border-t border-white p-5">
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <div className="rounded-xl bg-teal-tint p-4">
                              <p className="mb-1 text-xs font-semibold text-teal">Conformes</p>
                              <p className="text-xl font-bold text-teal">{c.conformes}</p>
                            </div>
                            <div className="rounded-xl bg-coral-tint p-4">
                              <p className="mb-1 text-xs font-semibold text-coral">Não Conformes</p>
                              <p className="text-xl font-bold text-coral">{c.naoConformes}</p>
                            </div>
                            <div className="rounded-xl bg-white p-4">
                              <p className="mb-1 text-xs font-semibold text-ink-muted">N/A</p>
                              <p className="text-xl font-bold text-ink-muted">{c.naAplicavel}</p>
                            </div>
                            <div className="rounded-xl bg-blue-tint p-4">
                              <p className="mb-1 text-xs font-semibold text-blue">Total</p>
                              <p className="text-xl font-bold text-blue">{c.total}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
