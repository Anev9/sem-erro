'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, BarChart2, Building2 } from 'lucide-react'

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
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>

        <button
          onClick={() => router.back()}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1rem', backgroundColor: 'white', border: '1px solid #e5e7eb',
            borderRadius: '0.5rem', cursor: 'pointer', color: '#374151',
            fontSize: '0.95rem', marginBottom: '2rem'
          }}
        >
          <ArrowLeft size={18} />
          Voltar
        </button>

        <div style={{ backgroundColor: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                <BarChart2 size={28} style={{ color: '#f97316' }} />
                <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Indicadores</h1>
              </div>
              <p style={{ color: '#6b7280', margin: 0, fontSize: '0.95rem' }}>
                Performance das empresas e atividade no período
              </p>
            </div>
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              style={{
                padding: '0.5rem 1rem', border: '1px solid #e5e7eb',
                borderRadius: '0.5rem', fontSize: '0.875rem', outline: 'none', cursor: 'pointer'
              }}
            >
              <option value="7">Últimos 7 dias</option>
              <option value="15">Últimos 15 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="60">Últimos 60 dias</option>
            </select>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', color: '#6b7280', padding: '3rem 0' }}>Carregando dados...</p>
          ) : totalRespostas === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
              <BarChart2 size={56} style={{ color: '#9ca3af', margin: '0 auto 1rem' }} />
              <p style={{ color: '#6b7280', fontSize: '1rem' }}>
                Nenhum dado disponível no período selecionado.<br />
                Os dados aparecem conforme os checklists são respondidos.
              </p>
            </div>
          ) : (
            <>
              {/* Resumo */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ backgroundColor: '#fff7ed', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #fed7aa' }}>
                  <p style={{ fontSize: '0.8rem', color: '#9a3412', margin: '0 0 0.5rem', fontWeight: '600' }}>Total de Respostas</p>
                  <p style={{ fontSize: '2rem', fontWeight: '900', color: '#f97316', margin: 0 }}>{totalRespostas}</p>
                </div>
                <div style={{ backgroundColor: '#f0fdf4', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #bbf7d0' }}>
                  <p style={{ fontSize: '0.8rem', color: '#166534', margin: '0 0 0.5rem', fontWeight: '600' }}>Taxa de Conformidade</p>
                  <p style={{ fontSize: '2rem', fontWeight: '900', color: '#16a34a', margin: 0 }}>{taxaGeral}%</p>
                </div>
                <div style={{ backgroundColor: '#eff6ff', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #bfdbfe' }}>
                  <p style={{ fontSize: '0.8rem', color: '#1e40af', margin: '0 0 0.5rem', fontWeight: '600' }}>Empresas</p>
                  <p style={{ fontSize: '2rem', fontWeight: '900', color: '#3b82f6', margin: 0 }}>{empresas.length}</p>
                </div>
                <div style={{ backgroundColor: '#fefce8', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #fde68a' }}>
                  <p style={{ fontSize: '0.8rem', color: '#92400e', margin: '0 0 0.5rem', fontWeight: '600' }}>Dias com atividade</p>
                  <p style={{ fontSize: '2rem', fontWeight: '900', color: '#d97706', margin: 0 }}>{dadosDiarios.length}</p>
                </div>
              </div>

              {/* Gráfico de barras diário */}
              {dadosDiarios.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
                    Atividade por Dia
                  </h2>
                  <div style={{ backgroundColor: '#f9fafb', borderRadius: '0.75rem', padding: '1.5rem', border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '160px', overflowX: 'auto', paddingBottom: '2rem' }}>
                      {dadosDiarios.map((d, i) => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '0 0 auto', minWidth: '32px' }}>
                          <span style={{ fontSize: '0.65rem', color: '#9ca3af', marginBottom: '4px' }}>{d.total}</span>
                          <div
                            title={`${d.dia}: ${d.total} respostas (${d.conformes} conformes)`}
                            style={{
                              width: '28px',
                              height: `${Math.max((d.total / maxDia) * 120, 4)}px`,
                              backgroundColor: '#f97316',
                              borderRadius: '3px 3px 0 0',
                              opacity: 0.85,
                              cursor: 'pointer',
                              transition: 'opacity 0.2s'
                            }}
                          />
                          <p style={{
                            fontSize: '0.6rem', color: '#9ca3af', margin: '4px 0 0',
                            whiteSpace: 'nowrap', transform: 'rotate(-45deg)',
                            transformOrigin: 'top left', width: '40px'
                          }}>
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
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
                    Performance por Empresa
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {empresas.map((e, i) => {
                      const cor = e.taxa >= 90 ? '#16a34a' : e.taxa >= 75 ? '#3b82f6' : '#f97316'
                      const medalha = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`
                      return (
                        <div key={e.nome} style={{ backgroundColor: '#f9fafb', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #e5e7eb' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '1.25rem' }}>{medalha}</span>
                            <div style={{ flex: 1 }}>
                              <span style={{ fontWeight: '700', color: '#1f2937' }}>{e.nome}</span>
                              <span style={{ fontSize: '0.8rem', color: '#6b7280', marginLeft: '0.75rem' }}>
                                {e.conformes} conformes · {e.naoConformes} não conformes · {e.total} total
                              </span>
                            </div>
                            <span style={{ fontSize: '1.75rem', fontWeight: '900', color: cor }}>{e.taxa}%</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '9999px', overflow: 'hidden' }}>
                            <div style={{ width: `${e.taxa}%`, height: '100%', backgroundColor: cor, borderRadius: '9999px', transition: 'width 0.8s ease' }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
