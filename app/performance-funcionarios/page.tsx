'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, TrendingUp, Users } from 'lucide-react'

interface ColaboradorStats {
  nome: string
  empresa: string
  total: number
  conformes: number
  naoConformes: number
  naAplicavel: number
  performance: number
}

export default function PerformanceColaboradores() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
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

  async function carregarDados(alunoId: string) {
    try {
      setLoading(true)
      const res = await fetch(`/api/aluno/respostas?aluno_id=${alunoId}`)
      if (!res.ok) throw new Error('Erro ao carregar')
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
      console.error('Erro:', error)
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

          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <TrendingUp size={28} style={{ color: '#f97316' }} />
              <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                Performance de Colaboradores
              </h1>
            </div>
            <p style={{ color: '#6b7280', margin: 0, fontSize: '0.95rem' }}>
              Desempenho da equipe com base nas respostas dos checklists
            </p>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', color: '#6b7280', padding: '3rem 0' }}>Carregando dados...</p>
          ) : colaboradores.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
              <Users size={56} style={{ color: '#9ca3af', margin: '0 auto 1rem' }} />
              <p style={{ color: '#6b7280', fontSize: '1rem' }}>
                Nenhum dado disponível ainda.<br />
                Os dados aparecem conforme os colaboradores respondem checklists.
              </p>
            </div>
          ) : (
            <>
              {/* Resumo */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ backgroundColor: '#fff7ed', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #fed7aa' }}>
                  <p style={{ fontSize: '0.8rem', color: '#9a3412', margin: '0 0 0.5rem', fontWeight: '600' }}>Colaboradores</p>
                  <p style={{ fontSize: '2rem', fontWeight: '900', color: '#f97316', margin: 0 }}>{colaboradores.length}</p>
                </div>
                <div style={{ backgroundColor: '#f0fdf4', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #bbf7d0' }}>
                  <p style={{ fontSize: '0.8rem', color: '#166534', margin: '0 0 0.5rem', fontWeight: '600' }}>Média Geral</p>
                  <p style={{ fontSize: '2rem', fontWeight: '900', color: '#16a34a', margin: 0 }}>{mediaPerf}%</p>
                </div>
                <div style={{ backgroundColor: '#eff6ff', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #bfdbfe' }}>
                  <p style={{ fontSize: '0.8rem', color: '#1e40af', margin: '0 0 0.5rem', fontWeight: '600' }}>Total Respostas</p>
                  <p style={{ fontSize: '2rem', fontWeight: '900', color: '#3b82f6', margin: 0 }}>{totalRespostas}</p>
                </div>
                <div style={{ backgroundColor: '#fefce8', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #fde68a' }}>
                  <p style={{ fontSize: '0.8rem', color: '#92400e', margin: '0 0 0.5rem', fontWeight: '600' }}>Excelentes (≥90%)</p>
                  <p style={{ fontSize: '2rem', fontWeight: '900', color: '#d97706', margin: 0 }}>{excelentes}</p>
                </div>
              </div>

              {/* Busca */}
              <input
                type="text"
                placeholder="Buscar por nome..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                style={{
                  width: '100%', padding: '0.75rem 1rem', border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem', fontSize: '0.95rem', marginBottom: '1.5rem',
                  outline: 'none', boxSizing: 'border-box'
                }}
              />

              {/* Ranking */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filtrados.map((c, i) => {
                  const perfColor = c.performance >= 90 ? '#16a34a' : c.performance >= 75 ? '#3b82f6' : '#f97316'
                  const perfBg = c.performance >= 90 ? '#f0fdf4' : c.performance >= 75 ? '#eff6ff' : '#fff7ed'
                  const medalha = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`

                  return (
                    <div key={c.nome} style={{ backgroundColor: '#f9fafb', borderRadius: '0.75rem', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                      <div style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>

                          <div style={{ fontSize: '1.5rem', minWidth: '2.5rem', textAlign: 'center' }}>{medalha}</div>

                          <div style={{ flex: 1, minWidth: '180px' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0 0 0.2rem', color: '#1f2937' }}>{c.nome}</h3>
                            <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>{c.empresa}</p>
                          </div>

                          <div style={{ display: 'flex', gap: '1.25rem' }}>
                            <div style={{ textAlign: 'center' }}>
                              <p style={{ fontSize: '0.7rem', color: '#9ca3af', margin: '0 0 0.2rem' }}>Total</p>
                              <p style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0, color: '#374151' }}>{c.total}</p>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <p style={{ fontSize: '0.7rem', color: '#16a34a', margin: '0 0 0.2rem' }}>Conformes</p>
                              <p style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0, color: '#16a34a' }}>{c.conformes}</p>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <p style={{ fontSize: '0.7rem', color: '#ef4444', margin: '0 0 0.2rem' }}>Não Conf.</p>
                              <p style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0, color: '#ef4444' }}>{c.naoConformes}</p>
                            </div>
                          </div>

                          <div style={{ textAlign: 'center', padding: '0.75rem 1.25rem', backgroundColor: perfBg, borderRadius: '0.5rem', minWidth: '80px' }}>
                            <p style={{ fontSize: '2rem', fontWeight: '900', color: perfColor, margin: 0, lineHeight: 1 }}>{c.performance}%</p>
                            <p style={{ fontSize: '0.7rem', color: '#6b7280', margin: '0.25rem 0 0' }}>conformidade</p>
                          </div>

                          <button
                            onClick={() => setExpandido(expandido === c.nome ? null : c.nome)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '1.25rem', padding: '0.25rem' }}
                          >
                            {expandido === c.nome ? '▲' : '▼'}
                          </button>
                        </div>

                        <div style={{ marginTop: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.375rem' }}>
                            <span>Taxa de conformidade</span><span>{c.performance}%</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '9999px', overflow: 'hidden' }}>
                            <div style={{ width: `${c.performance}%`, height: '100%', backgroundColor: perfColor, borderRadius: '9999px', transition: 'width 0.8s ease' }} />
                          </div>
                        </div>
                      </div>

                      {expandido === c.nome && (
                        <div style={{ borderTop: '1px solid #e5e7eb', padding: '1.25rem', backgroundColor: 'white' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                            <div style={{ backgroundColor: '#f0fdf4', borderRadius: '0.5rem', padding: '1rem', border: '1px solid #bbf7d0' }}>
                              <p style={{ fontSize: '0.8rem', color: '#166534', margin: '0 0 0.25rem', fontWeight: '600' }}>Conformes</p>
                              <p style={{ fontSize: '1.5rem', fontWeight: '900', color: '#16a34a', margin: 0 }}>{c.conformes}</p>
                            </div>
                            <div style={{ backgroundColor: '#fef2f2', borderRadius: '0.5rem', padding: '1rem', border: '1px solid #fecaca' }}>
                              <p style={{ fontSize: '0.8rem', color: '#991b1b', margin: '0 0 0.25rem', fontWeight: '600' }}>Não Conformes</p>
                              <p style={{ fontSize: '1.5rem', fontWeight: '900', color: '#ef4444', margin: 0 }}>{c.naoConformes}</p>
                            </div>
                            <div style={{ backgroundColor: '#f9fafb', borderRadius: '0.5rem', padding: '1rem', border: '1px solid #e5e7eb' }}>
                              <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0 0 0.25rem', fontWeight: '600' }}>N/A</p>
                              <p style={{ fontSize: '1.5rem', fontWeight: '900', color: '#6b7280', margin: 0 }}>{c.naAplicavel}</p>
                            </div>
                            <div style={{ backgroundColor: '#eff6ff', borderRadius: '0.5rem', padding: '1rem', border: '1px solid #bfdbfe' }}>
                              <p style={{ fontSize: '0.8rem', color: '#1e40af', margin: '0 0 0.25rem', fontWeight: '600' }}>Total</p>
                              <p style={{ fontSize: '1.5rem', fontWeight: '900', color: '#3b82f6', margin: 0 }}>{c.total}</p>
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
        </div>
      </div>
    </div>
  )
}
