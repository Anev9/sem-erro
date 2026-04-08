'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface LogEntry {
  id: string
  aluno_id: string
  aluno_nome: string | null
  acao: string
  detalhe: string | null
  created_at: string
}

const ACOES_LABELS: Record<string, string> = {
  ativo_alterado: '🔄 Status alterado',
  cliente_criado: '➕ Cliente criado',
  cliente_excluido: '🗑️ Cliente excluído',
  checklist_criado: '📋 Checklist criado',
  acao_criada: '⚡ Ação criada',
  acao_concluida: '✅ Ação concluída',
  login: '🔑 Login',
}

export default function AuditoriaPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState({ dataInicio: '', dataFim: '', acao: '', busca: '' })
  const [exportando, setExportando] = useState(false)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limite: '200' })
      if (filtros.dataInicio) params.set('data_inicio', filtros.dataInicio)
      if (filtros.dataFim) params.set('data_fim', filtros.dataFim)
      if (filtros.acao) params.set('acao', filtros.acao)
      const res = await fetch(`/api/admin/log-alteracoes?${params}`)
      if (res.ok) setLogs(await res.json())
    } finally {
      setLoading(false)
    }
  }, [filtros.dataInicio, filtros.dataFim, filtros.acao])

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) { router.push('/login'); return }
    const user = JSON.parse(userData)
    if (user.role !== 'admin') { router.push('/login'); return }
    carregar()
  }, [carregar])

  const logsFiltrados = logs.filter(l => {
    if (!filtros.busca) return true
    const q = filtros.busca.toLowerCase()
    return (l.aluno_nome || '').toLowerCase().includes(q) ||
      (l.detalhe || '').toLowerCase().includes(q) ||
      l.acao.toLowerCase().includes(q)
  })

  function exportarCSV() {
    setExportando(true)
    const linhas = [
      ['Data/Hora', 'Cliente', 'Ação', 'Detalhe'],
      ...logsFiltrados.map(l => [
        new Date(l.created_at).toLocaleString('pt-BR'),
        l.aluno_nome || l.aluno_id,
        ACOES_LABELS[l.acao] || l.acao,
        l.detalhe || '',
      ])
    ]
    const csv = linhas.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `auditoria_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setExportando(false)
  }

  const acoesUnicas = Array.from(new Set(logs.map(l => l.acao))).sort()

  const inputStyle = {
    padding: '0.5rem 0.75rem', border: '1.5px solid #e2e8f0', borderRadius: '0.5rem',
    fontSize: '0.875rem', outline: 'none', background: 'white',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      {/* Header */}
      <nav style={{ background: '#334155', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', height: '4rem' }}>
          <button onClick={() => router.push('/dashboard-admin')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 0.875rem', color: 'white', cursor: 'pointer', fontSize: '0.875rem' }}>
            ← Voltar
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🔍</span>
            <span style={{ color: 'white', fontWeight: '700', fontSize: '1.1rem' }}>Auditoria do Sistema</span>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Filtros */}
        <div style={{ background: 'white', borderRadius: '1rem', padding: '1.25rem 1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="🔍 Buscar cliente, ação, detalhe..."
              value={filtros.busca}
              onChange={e => setFiltros(f => ({ ...f, busca: e.target.value }))}
              style={{ ...inputStyle, flex: '1 1 200px', minWidth: '160px' }}
            />
            <select
              value={filtros.acao}
              onChange={e => setFiltros(f => ({ ...f, acao: e.target.value }))}
              style={inputStyle}
            >
              <option value="">Todos os eventos</option>
              {acoesUnicas.map(a => (
                <option key={a} value={a}>{ACOES_LABELS[a] || a}</option>
              ))}
            </select>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>De</span>
              <input type="date" value={filtros.dataInicio}
                onChange={e => setFiltros(f => ({ ...f, dataInicio: e.target.value }))}
                style={inputStyle} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Até</span>
              <input type="date" value={filtros.dataFim}
                onChange={e => setFiltros(f => ({ ...f, dataFim: e.target.value }))}
                style={inputStyle} />
            </div>
            <button onClick={carregar}
              style={{ padding: '0.5rem 1.25rem', background: '#334155', color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer' }}>
              Filtrar
            </button>
            <button onClick={exportarCSV} disabled={exportando || logsFiltrados.length === 0}
              style={{ padding: '0.5rem 1.25rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer', opacity: logsFiltrados.length === 0 ? 0.5 : 1 }}>
              {exportando ? 'Exportando...' : '⬇ CSV'}
            </button>
          </div>
        </div>

        {/* Tabela */}
        <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.95rem' }}>
              {loading ? 'Carregando...' : `${logsFiltrados.length} registro${logsFiltrados.length !== 1 ? 's' : ''}`}
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>Carregando registros...</div>
          ) : logsFiltrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</div>
              <p style={{ color: '#64748b' }}>Nenhum registro encontrado.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    {['Data/Hora', 'Cliente', 'Evento', 'Detalhe'].map(h => (
                      <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logsFiltrados.map((log, idx) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {new Date(log.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', fontWeight: '600', color: '#1e293b' }}>
                        {log.aluno_nome || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>—</span>}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span style={{
                          fontSize: '0.8rem', fontWeight: '600', padding: '0.25rem 0.75rem',
                          borderRadius: '999px', whiteSpace: 'nowrap',
                          background: log.acao.includes('exclu') ? '#fef2f2' : log.acao.includes('cria') ? '#f0fdf4' : '#f0f9ff',
                          color: log.acao.includes('exclu') ? '#dc2626' : log.acao.includes('cria') ? '#16a34a' : '#0369a1',
                        }}>
                          {ACOES_LABELS[log.acao] || log.acao}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.85rem', color: '#475569', maxWidth: '360px' }}>
                        {log.detalhe || <span style={{ color: '#cbd5e1' }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
