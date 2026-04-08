'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface EmpresaStat {
  id: string
  nome_fantasia: string
  ativo: boolean
  created_at: string
  totalChecklists: number
  totalAcoes: number
  acoesConcluidas: number
  acoesAbertas: number
  acoesAtrasadas: number
  acoesUrgentes: number
  taxaConclusao: number
}

export default function DashboardEmpresa() {
  const router = useRouter()
  const [stats, setStats] = useState<EmpresaStat[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroAtivo, setFiltroAtivo] = useState<'todas' | 'ativas' | 'inativas'>('ativas')

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) { router.push('/login'); return }
    const user = JSON.parse(userStr)
    if (user.role !== 'aluno') { router.push('/login'); return }
    carregar()
  }, [])

  async function carregar() {
    try {
      const res = await fetch('/api/aluno/empresa-stats')
      if (res.ok) setStats(await res.json())
    } finally {
      setLoading(false)
    }
  }

  const empresasFiltradas = stats.filter(e => {
    if (filtroAtivo === 'ativas') return e.ativo !== false
    if (filtroAtivo === 'inativas') return e.ativo === false
    return true
  })

  const totalAcoes = stats.reduce((s, e) => s + e.totalAcoes, 0)
  const totalConcluidas = stats.reduce((s, e) => s + e.acoesConcluidas, 0)
  const totalAtrasadas = stats.reduce((s, e) => s + e.acoesAtrasadas, 0)
  const totalUrgentes = stats.reduce((s, e) => s + e.acoesUrgentes, 0)
  const totalChecklists = stats.reduce((s, e) => s + e.totalChecklists, 0)

  const btnFiltro = (val: typeof filtroAtivo, label: string) => (
    <button
      onClick={() => setFiltroAtivo(val)}
      style={{
        padding: '0.5rem 1.25rem', borderRadius: '2rem', border: 'none',
        background: filtroAtivo === val ? '#334155' : '#e2e8f0',
        color: filtroAtivo === val ? 'white' : '#475569',
        fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.15s'
      }}
    >{label}</button>
  )

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#64748b' }}>Carregando...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      {/* Header */}
      <nav style={{ background: '#334155', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', height: '4rem' }}>
          <button onClick={() => router.push('/dashboard-aluno')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 0.875rem', color: 'white', cursor: 'pointer', fontSize: '0.875rem' }}>
            ← Voltar
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🏢</span>
            <span style={{ color: 'white', fontWeight: '700', fontSize: '1.1rem' }}>Dashboard por Empresa</span>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Resumo geral */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Empresas', value: stats.length, icon: '🏢', bg: '#e0f2fe', color: '#0369a1' },
            { label: 'Checklists', value: totalChecklists, icon: '📋', bg: '#ede9fe', color: '#7c3aed' },
            { label: 'Total de Ações', value: totalAcoes, icon: '✅', bg: '#f0fdf4', color: '#16a34a' },
            { label: 'Concluídas', value: totalConcluidas, icon: '🎯', bg: '#dcfce7', color: '#15803d' },
            { label: 'Atrasadas', value: totalAtrasadas, icon: '⚠️', bg: '#fef2f2', color: '#dc2626' },
            { label: 'Urgentes', value: totalUrgentes, icon: '🔴', bg: '#fff7ed', color: '#c2410c' },
          ].map(card => (
            <div key={card.label} style={{ background: card.bg, borderRadius: '0.875rem', padding: '1.25rem', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>{card.icon}</div>
              <div style={{ fontSize: '1.75rem', fontWeight: '800', color: card.color }}>{card.value}</div>
              <div style={{ fontSize: '0.75rem', color: card.color, fontWeight: '600', opacity: 0.8 }}>{card.label}</div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>
            Empresas ({empresasFiltradas.length})
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {btnFiltro('todas', 'Todas')}
            {btnFiltro('ativas', 'Ativas')}
            {btnFiltro('inativas', 'Inativas')}
          </div>
        </div>

        {/* Cards de empresa */}
        {empresasFiltradas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏢</div>
            <p style={{ color: '#64748b', fontSize: '1rem' }}>Nenhuma empresa encontrada.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {empresasFiltradas.map(emp => (
              <div key={emp.id} style={{
                background: 'white', borderRadius: '1rem', padding: '1.5rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                border: `2px solid ${emp.acoesAtrasadas > 0 ? '#fecaca' : emp.acoesUrgentes > 0 ? '#fed7aa' : '#e2e8f0'}`,
                transition: 'box-shadow 0.15s'
              }}>
                {/* Cabeçalho da empresa */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#1e293b', margin: '0 0 0.25rem' }}>
                      {emp.nome_fantasia}
                    </h3>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: '700', padding: '0.125rem 0.625rem',
                      borderRadius: '999px',
                      background: emp.ativo !== false ? '#dcfce7' : '#f1f5f9',
                      color: emp.ativo !== false ? '#15803d' : '#64748b',
                    }}>
                      {emp.ativo !== false ? '● Ativa' : '○ Inativa'}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '2rem', fontWeight: '800', color: '#334155', lineHeight: 1 }}>{emp.taxaConclusao}%</div>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: '600' }}>CONCLUSÃO</div>
                  </div>
                </div>

                {/* Barra de progresso */}
                <div style={{ background: '#e2e8f0', borderRadius: '999px', height: '8px', marginBottom: '1.25rem', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '999px', transition: 'width 0.4s ease',
                    width: `${emp.taxaConclusao}%`,
                    background: emp.taxaConclusao >= 80 ? '#22c55e' : emp.taxaConclusao >= 50 ? '#f59e0b' : '#ef4444',
                  }} />
                </div>

                {/* Métricas */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  {[
                    { label: 'Checklists', value: emp.totalChecklists, color: '#7c3aed' },
                    { label: 'Ações abertas', value: emp.acoesAbertas, color: '#334155' },
                    { label: 'Concluídas', value: emp.acoesConcluidas, color: '#16a34a' },
                  ].map(m => (
                    <div key={m.label} style={{ textAlign: 'center', background: '#f8fafc', borderRadius: '0.625rem', padding: '0.625rem 0.375rem' }}>
                      <div style={{ fontSize: '1.375rem', fontWeight: '800', color: m.color }}>{m.value}</div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '600' }}>{m.label}</div>
                    </div>
                  ))}
                </div>

                {/* Alertas */}
                {(emp.acoesAtrasadas > 0 || emp.acoesUrgentes > 0) && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {emp.acoesAtrasadas > 0 && (
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '0.25rem 0.75rem', borderRadius: '999px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                        ⚠️ {emp.acoesAtrasadas} atrasada{emp.acoesAtrasadas > 1 ? 's' : ''}
                      </span>
                    )}
                    {emp.acoesUrgentes > 0 && (
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '0.25rem 0.75rem', borderRadius: '999px', background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }}>
                        🔴 {emp.acoesUrgentes} urgente{emp.acoesUrgentes > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                )}

                {/* Botão ver ações */}
                <button
                  onClick={() => router.push(`/acoes?empresa=${emp.id}`)}
                  style={{
                    marginTop: '1rem', width: '100%', padding: '0.625rem', border: '2px solid #e2e8f0',
                    borderRadius: '0.5rem', background: 'white', color: '#334155', fontSize: '0.8rem',
                    fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#334155'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#334155'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#334155'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                >
                  Ver ações desta empresa →
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
