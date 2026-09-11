'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'

interface EmpresaStats {
  nome: string
  total: number
  conformes: number
  naoConformes: number
  taxa: number
}

interface DadoDia {
  dia: string
  total: number
  conformes: number
}

function taxaTone(taxa: number) {
  if (taxa >= 90) return { text: 'text-teal', bar: 'bg-teal' }
  if (taxa >= 75) return { text: 'text-blue', bar: 'bg-blue' }
  return { text: 'text-amber', bar: 'bg-amber' }
}

export default function DashboardIndicadores() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [empresas, setEmpresas] = useState<EmpresaStats[]>([])
  const [dadosDiarios, setDadosDiarios] = useState<DadoDia[]>([])
  const [totalRespostas, setTotalRespostas] = useState(0)
  const [taxaGeral, setTaxaGeral] = useState(0)
  const [periodo, setPeriodo] = useState('30')
  const [alunoId, setAlunoId] = useState('')

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) { router.push('/login'); return }
    const user = JSON.parse(userData)
    if (user.role !== 'aluno') { router.push('/login'); return }
    const id = user.id || user.aluno_id
    setAlunoId(id)
    carregarDados(id, periodo)
  }, [router])

  useEffect(() => {
    if (alunoId) carregarDados(alunoId, periodo)
  }, [periodo])

  async function carregarDados(id: string, dias: string) {
    try {
      setLoading(true)
      const dataInicio = new Date()
      dataInicio.setDate(dataInicio.getDate() - parseInt(dias))

      const res = await fetch(`/api/aluno/respostas?aluno_id=${id}&data_inicio=${dataInicio.toISOString().split('T')[0]}`)
      if (!res.ok) throw new Error('Erro ao carregar')
      const { respostas } = await res.json()

      if (!respostas || respostas.length === 0) {
        setEmpresas([])
        setDadosDiarios([])
        setTotalRespostas(0)
        setTaxaGeral(0)
        setLoading(false)
        return
      }

      // Agrupar por empresa
      const mapaEmpresas: Record<string, EmpresaStats> = {}
      // Agrupar por dia (formato: "dd/mm/aaaa hh:mm")
      const mapaDias: Record<string, { total: number; conformes: number }> = {}
      let totalConformes = 0

      for (const r of respostas) {
        const emp = r.empresa || 'Desconhecida'
        if (!mapaEmpresas[emp]) {
          mapaEmpresas[emp] = { nome: emp, total: 0, conformes: 0, naoConformes: 0, taxa: 0 }
        }
        mapaEmpresas[emp].total++
        if (r.resultado === 'conforme') { mapaEmpresas[emp].conformes++; totalConformes++ }
        else if (r.resultado === 'nao_conforme') mapaEmpresas[emp].naoConformes++

        const dia = r.data?.split(' ')[0] || ''
        if (dia) {
          if (!mapaDias[dia]) mapaDias[dia] = { total: 0, conformes: 0 }
          mapaDias[dia].total++
          if (r.resultado === 'conforme') mapaDias[dia].conformes++
        }
      }

      const listaEmpresas = Object.values(mapaEmpresas).map(e => {
        const validas = e.conformes + e.naoConformes
        e.taxa = validas > 0 ? Math.round((e.conformes / validas) * 100) : 0
        return e
      }).sort((a, b) => b.taxa - a.taxa)

      const listaDias = Object.entries(mapaDias)
        .map(([dia, v]) => ({ dia, ...v }))
        .sort((a, b) => {
          const [da, ma, ya] = a.dia.split('/').map(Number)
          const [db, mb, yb] = b.dia.split('/').map(Number)
          return new Date(ya, ma - 1, da).getTime() - new Date(yb, mb - 1, db).getTime()
        })

      const taxaG = respostas.length > 0 ? Math.round((totalConformes / respostas.length) * 100) : 0

      setEmpresas(listaEmpresas)
      setDadosDiarios(listaDias)
      setTotalRespostas(respostas.length)
      setTaxaGeral(taxaG)
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  const maxDia = dadosDiarios.length > 0 ? Math.max(...dadosDiarios.map(d => d.total)) : 1

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1200px] px-6 py-8">
        <PageHeader
          title="Indicadores"
          subtitle="Performance das empresas e atividade no período"
          backHref="/dashboard-aluno"
          actions={
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="cursor-pointer rounded-xl bg-white px-3.5 py-2 text-sm text-ink-muted shadow-soft-sm outline-none"
            >
              <option value="7">Últimos 7 dias</option>
              <option value="15">Últimos 15 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="60">Últimos 60 dias</option>
            </select>
          }
        />

        <Card className="p-6 sm:p-8">
          {loading ? (
            <p className="py-12 text-center text-sm text-ink-muted">Carregando dados...</p>
          ) : totalRespostas === 0 ? (
            <div className="py-16 text-center">
              <BarChart2 size={48} className="mx-auto mb-4 text-ink-faint" />
              <p className="text-sm text-ink-muted">
                Nenhum dado disponível no período selecionado.<br />
                Os dados aparecem conforme os checklists são respondidos.
              </p>
            </div>
          ) : (
            <>
              {/* Resumo */}
              <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-2xl bg-brand-tint p-5">
                  <p className="mb-1.5 text-xs font-semibold text-brand">Total de Respostas</p>
                  <p className="font-display text-3xl font-bold text-brand">{totalRespostas}</p>
                </div>
                <div className="rounded-2xl bg-teal-tint p-5">
                  <p className="mb-1.5 text-xs font-semibold text-teal">Taxa de Conformidade</p>
                  <p className="font-display text-3xl font-bold text-teal">{taxaGeral}%</p>
                </div>
                <div className="rounded-2xl bg-blue-tint p-5">
                  <p className="mb-1.5 text-xs font-semibold text-blue">Empresas</p>
                  <p className="font-display text-3xl font-bold text-blue">{empresas.length}</p>
                </div>
                <div className="rounded-2xl bg-amber-tint p-5">
                  <p className="mb-1.5 text-xs font-semibold text-amber">Dias com atividade</p>
                  <p className="font-display text-3xl font-bold text-amber">{dadosDiarios.length}</p>
                </div>
              </div>

              {/* Gráfico de barras diário */}
              {dadosDiarios.length > 0 && (
                <div className="mb-8">
                  <h2 className="mb-4 font-display text-lg font-bold text-ink">Atividade por Dia</h2>
                  <div className="rounded-2xl bg-surface-2 p-6">
                    <div className="flex items-end gap-1 overflow-x-auto pb-8" style={{ height: '160px' }}>
                      {dadosDiarios.map((d, i) => (
                        <div key={i} className="flex min-w-[32px] flex-none flex-col items-center">
                          <span className="mb-1 text-[10px] text-ink-faint">{d.total}</span>
                          <div
                            title={`${d.dia}: ${d.total} respostas (${d.conformes} conformes)`}
                            className="w-7 cursor-pointer rounded-t-[3px] bg-brand opacity-85 transition-opacity hover:opacity-100"
                            style={{ height: `${Math.max((d.total / maxDia) * 120, 4)}px` }}
                          />
                          <p
                            className="mt-1 w-10 origin-top-left whitespace-nowrap text-[9px] text-ink-faint"
                            style={{ transform: 'rotate(-45deg)' }}
                          >
                            {d.dia.substring(0, 5)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Performance por empresa */}
              {empresas.length > 0 && (
                <div>
                  <h2 className="mb-4 font-display text-lg font-bold text-ink">Performance por Empresa</h2>
                  <div className="flex flex-col gap-3">
                    {empresas.map((e, i) => {
                      const tone = taxaTone(e.taxa)
                      const medalha = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`
                      return (
                        <div key={e.nome} className="rounded-2xl bg-surface-2 p-5">
                          <div className="mb-3 flex flex-wrap items-center gap-4">
                            <span className="text-xl">{medalha}</span>
                            <div className="flex-1">
                              <span className="font-bold text-ink">{e.nome}</span>
                              <span className="ml-3 text-xs text-ink-muted">
                                {e.conformes} conformes · {e.naoConformes} não conformes · {e.total} total
                              </span>
                            </div>
                            <span className={`text-2xl font-bold ${tone.text}`}>{e.taxa}%</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-white">
                            <div className={`h-full rounded-full transition-[width] duration-700 ${tone.bar}`} style={{ width: `${e.taxa}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
