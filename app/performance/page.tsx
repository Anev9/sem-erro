'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, TrendingUp, Building2, CheckSquare, AlertTriangle, Search, Download, Printer } from 'lucide-react'

interface ClientePerformance {
  aluno_id: number
  nome: string
  email: string | null
  ativo: boolean
  ultimo_login: string | null
  empresas: number
  checklists: { total: number; concluidos: number; mes: number }
  acoes: { total: number; concluidas: number; atrasadas: number; mes: number }
}

export default function PerformancePage() {
  const router = useRouter()
  const [dados, setDados] = useState<ClientePerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [ordenacao, setOrdenacao] = useState<'nome' | 'checklists' | 'acoes' | 'atrasadas'>('nome')
  const [filtroAtivo, setFiltroAtivo] = useState<'todos' | 'ativo' | 'inativo'>('todos')

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) { router.push('/login'); return }
    const user = JSON.parse(userData)
    if (user.role !== 'admin') { router.push('/login'); return }
    carregarDados()
  }, [router])

  async function carregarDados() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/stats')
      if (!res.ok) return
      const { performanceGeral } = await res.json()
      setDados(performanceGeral || [])
    } catch {
      // silencioso
    } finally {
      setLoading(false)
    }
  }

  const dadosFiltrados = dados
    .filter(d => {
      if (filtroAtivo === 'ativo' && !d.ativo) return false
      if (filtroAtivo === 'inativo' && d.ativo) return false
      if (busca.trim()) {
        const q = busca.toLowerCase()
        return d.nome.toLowerCase().includes(q) || (d.email || '').toLowerCase().includes(q)
      }
      return true
    })
    .sort((a, b) => {
      if (ordenacao === 'nome') return a.nome.localeCompare(b.nome)
      if (ordenacao === 'checklists') return b.checklists.total - a.checklists.total
      if (ordenacao === 'acoes') return b.acoes.total - a.acoes.total
      if (ordenacao === 'atrasadas') return b.acoes.atrasadas - a.acoes.atrasadas
      return 0
    })

  const totais = {
    clientes: dados.length,
    ativos: dados.filter(d => d.ativo).length,
    checklistsTotal: dados.reduce((s, d) => s + d.checklists.total, 0),
    acoesMes: dados.reduce((s, d) => s + d.acoes.mes, 0),
    atrasadasTotal: dados.reduce((s, d) => s + d.acoes.atrasadas, 0),
  }

  function calcPct(valor: number, total: number) {
    if (!total) return 0
    return Math.round((valor / total) * 100)
  }

  function formatarUltimoLogin(data: string | null) {
    if (!data) return '—'
    const d = new Date(data)
    const agora = new Date()
    const diffDias = Math.floor((agora.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDias === 0) return 'Hoje'
    if (diffDias === 1) return 'Ontem'
    if (diffDias < 7) return `${diffDias} dias atrás`
    return d.toLocaleDateString('pt-BR')
  }

  function exportarCSV() {
    const headers = ['Cliente', 'E-mail', 'Status', 'Empresas', 'Checklists Total', 'Checklists Concluídos', 'Checklists Mês', 'Ações Total', 'Ações Concluídas', 'Ações Atrasadas', 'Ações Mês', 'Último Login']
    const rows = dadosFiltrados.map(d => [
      d.nome,
      d.email || '',
      d.ativo ? 'Ativo' : 'Inativo',
      d.empresas,
      d.checklists.total,
      d.checklists.concluidos,
      d.checklists.mes,
      d.acoes.total,
      d.acoes.concluidas,
      d.acoes.atrasadas,
      d.acoes.mes,
      d.ultimo_login ? new Date(d.ultimo_login).toLocaleDateString('pt-BR') : '—',
    ])
    const csv = [headers, ...rows].map(r => r.join(';')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `performance-clientes-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      {/* Header */}
      <nav style={{ backgroundColor: '#334155', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', height: '4rem', gap: '1rem' }}>
          <button
            onClick={() => router.push('/dashboard-admin')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 0.875rem', color: 'white', cursor: 'pointer', fontSize: '0.875rem' }}
          >
            <ArrowLeft size={16} />
            Voltar
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <TrendingUp size={20} style={{ color: '#93c5fd' }} />
            <span style={{ color: 'white', fontWeight: '700', fontSize: '1.1rem' }}>Relatório de Performance</span>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Cards de totais */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total de Clientes', value: totais.clientes, color: '#3b82f6', bg: '#eff6ff', icon: '👥' },
            { label: 'Clientes Ativos', value: totais.ativos, color: '#10b981', bg: '#f0fdf4', icon: '✅' },
            { label: 'Checklists Criados', value: totais.checklistsTotal, color: '#6366f1', bg: '#eef2ff', icon: '📋' },
            { label: 'Ações este Mês', value: totais.acoesMes, color: '#8b5cf6', bg: '#f5f3ff', icon: '⚡' },
            { label: 'Ações Atrasadas', value: totais.atrasadasTotal, color: '#ef4444', bg: '#fef2f2', icon: '🔴' },
          ].map(card => (
            <div key={card.label} style={{ background: card.bg, borderRadius: '0.75rem', padding: '1.125rem 1.25rem', border: `1px solid ${card.color}25` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.375rem' }}>
                <span style={{ fontSize: '1rem' }}>{card.icon}</span>
                <span style={{ fontSize: '0.75rem', color: card.color, fontWeight: '600' }}>{card.label}</span>
              </div>
              <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: '800', color: card.color }}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Filtros e Ações */}
        <div style={{ background: 'white', borderRadius: '1rem', padding: '1rem 1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Busca */}
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                style={{ paddingLeft: '2rem', paddingRight: '0.75rem', paddingTop: '0.5rem', paddingBottom: '0.5rem', border: '1.5px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.875rem', outline: 'none', width: '200px' }}
              />
            </div>

            {/* Filtro ativo/inativo */}
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '0.375rem', padding: '2px', gap: '2px' }}>
              {(['todos', 'ativo', 'inativo'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFiltroAtivo(f)}
                  style={{ padding: '0.3rem 0.75rem', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', background: filtroAtivo === f ? 'white' : 'transparent', color: filtroAtivo === f ? '#334155' : '#6b7280', boxShadow: filtroAtivo === f ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}
                >
                  {f === 'todos' ? 'Todos' : f === 'ativo' ? 'Ativos' : 'Inativos'}
                </button>
              ))}
            </div>

            {/* Ordenação */}
            <select
              value={ordenacao}
              onChange={e => setOrdenacao(e.target.value as typeof ordenacao)}
              style={{ padding: '0.5rem 0.75rem', border: '1.5px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', background: 'white' }}
            >
              <option value="nome">Ordenar: Nome</option>
              <option value="checklists">Ordenar: + Checklists</option>
              <option value="acoes">Ordenar: + Ações</option>
              <option value="atrasadas">Ordenar: + Atrasadas</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={exportarCSV}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#334155', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600' }}
            >
              <Download size={15} />
              CSV
            </button>
            <button
              onClick={() => window.print()}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#1d4ed8', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600' }}
            >
              <Printer size={15} />
              PDF
            </button>
          </div>
        </div>

        {/* Tabela */}
        <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#9ca3af' }}>
              <div style={{ width: '36px', height: '36px', border: '3px solid #f3f4f6', borderTopColor: '#334155', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
              Carregando dados...
            </div>
          ) : dadosFiltrados.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#9ca3af' }}>
              <TrendingUp size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <p>Nenhum cliente encontrado</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    {['Cliente', 'Status', 'Empresas', 'Checklists', '% Concluído', 'Ações', 'Atrasadas', 'Atividade Mês', 'Último Login'].map(h => (
                      <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dadosFiltrados.map((d, idx) => {
                    const pctChecklist = calcPct(d.checklists.concluidos, d.checklists.total)
                    const atividadeMes = d.checklists.mes + d.acoes.mes
                    return (
                      <tr key={d.aluno_id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <p style={{ margin: 0, fontWeight: '600', color: '#1f2937', fontSize: '0.875rem' }}>{d.nome}</p>
                          {d.email && <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.75rem' }}>{d.email}</p>}
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <span style={{ padding: '0.25rem 0.625rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600', background: d.ativo ? '#d1fae5' : '#fee2e2', color: d.ativo ? '#059669' : '#dc2626' }}>
                            {d.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            <Building2 size={14} style={{ color: '#6b7280' }} />
                            <span style={{ fontSize: '0.875rem', color: '#374151', fontWeight: '600' }}>{d.empresas}</span>
                          </div>
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            <CheckSquare size={14} style={{ color: '#6366f1' }} />
                            <span style={{ fontSize: '0.875rem', color: '#374151', fontWeight: '600' }}>{d.checklists.total}</span>
                          </div>
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ flex: 1, minWidth: '60px', height: '6px', borderRadius: '999px', background: '#e2e8f0', overflow: 'hidden' }}>
                              <div style={{ width: `${pctChecklist}%`, height: '100%', background: pctChecklist >= 70 ? '#10b981' : pctChecklist >= 40 ? '#f59e0b' : '#ef4444', borderRadius: '999px' }} />
                            </div>
                            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: pctChecklist >= 70 ? '#059669' : pctChecklist >= 40 ? '#d97706' : '#dc2626', minWidth: '32px' }}>{pctChecklist}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <span style={{ fontSize: '0.875rem', color: '#374151', fontWeight: '600' }}>{d.acoes.total}</span>
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          {d.acoes.atrasadas > 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <AlertTriangle size={14} style={{ color: '#ef4444' }} />
                              <span style={{ fontSize: '0.875rem', color: '#dc2626', fontWeight: '700' }}>{d.acoes.atrasadas}</span>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.875rem', color: '#10b981', fontWeight: '600' }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <span style={{ padding: '0.2rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '700', background: atividadeMes > 0 ? '#eff6ff' : '#f9fafb', color: atividadeMes > 0 ? '#1d4ed8' : '#9ca3af' }}>
                            {atividadeMes > 0 ? `${atividadeMes} itens` : 'Sem atividade'}
                          </span>
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{formatarUltimoLogin(d.ultimo_login)}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.75rem', marginTop: '1rem' }}>
          {dadosFiltrados.length} cliente{dadosFiltrados.length !== 1 ? 's' : ''} exibido{dadosFiltrados.length !== 1 ? 's' : ''}
        </p>
      </main>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media print {
          nav, button, .no-print { display: none !important; }
          body { background: white !important; }
          main { padding: 0 !important; max-width: 100% !important; }
          div[style*="overflow: hidden"] { overflow: visible !important; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  )
}
