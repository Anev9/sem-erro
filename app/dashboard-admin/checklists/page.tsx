'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Aluno {
  id: number
  nome: string | null
}

interface ChecklistStatus {
  id: string
  titulo: string | null
  status: string
  progresso: number
  empresa_id: string | null
  empresa_nome: string
  aluno_id: number | null
  aluno_nome: string
  colaborador_nome: string
  concluido_por_nome: string | null
  concluido_em: string | null
  proxima_execucao: string | null
  data_inicio: string | null
  data_fim: string | null
  updated_at: string | null
}

const STATUS_INFO: Record<string, { bg: string; text: string; label: string }> = {
  concluido: { bg: '#dcfce7', text: '#166534', label: 'Concluído' },
  em_andamento: { bg: '#dbeafe', text: '#1e40af', label: 'Em Andamento' },
  pendente: { bg: '#fef3c7', text: '#92400e', label: 'Pendente' },
  atrasado: { bg: '#fee2e2', text: '#991b1b', label: 'Atrasado' },
}

function statusInfo(status: string) {
  return STATUS_INFO[status] || { bg: '#f3f4f6', text: '#374151', label: status }
}

function formatarData(data: string | null) {
  if (!data) return '—'
  return new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const inputStyle = {
  padding: '0.5rem 0.75rem', border: '1.5px solid #e2e8f0', borderRadius: '0.5rem',
  fontSize: '0.875rem', outline: 'none', background: 'white',
}

export default function ChecklistsAdminPage() {
  const router = useRouter()
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [checklists, setChecklists] = useState<ChecklistStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroAluno, setFiltroAluno] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [busca, setBusca] = useState('')

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroAluno) params.set('aluno_id', filtroAluno)
      if (filtroStatus) params.set('status', filtroStatus)
      const res = await fetch(`/api/admin/checklists-status?${params}`)
      if (res.ok) {
        const data = await res.json()
        setAlunos(data.alunos || [])
        setChecklists(data.checklists || [])
      }
    } finally {
      setLoading(false)
    }
  }, [filtroAluno, filtroStatus])

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) { router.push('/login'); return }
    const user = JSON.parse(userData)
    if (user.role !== 'admin') { router.push('/login'); return }
    carregar()
  }, [carregar, router])

  const checklistsFiltrados = checklists.filter((c) => {
    if (!busca.trim()) return true
    const q = busca.toLowerCase()
    return (
      (c.titulo || '').toLowerCase().includes(q) ||
      c.aluno_nome.toLowerCase().includes(q) ||
      c.empresa_nome.toLowerCase().includes(q) ||
      c.colaborador_nome.toLowerCase().includes(q)
    )
  })

  const total = checklistsFiltrados.length
  const concluidos = checklistsFiltrados.filter((c) => c.status === 'concluido').length
  const emAndamento = checklistsFiltrados.filter((c) => c.status === 'em_andamento').length
  const pendentes = checklistsFiltrados.filter((c) => c.status === 'pendente').length
  const atrasados = checklistsFiltrados.filter((c) => c.status === 'atrasado').length

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <nav style={{ background: '#334155', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', height: '4rem' }}>
          <button onClick={() => router.push('/dashboard-admin')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 0.875rem', color: 'white', cursor: 'pointer', fontSize: '0.875rem' }}>
            ← Voltar
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <span style={{ fontSize: '1.25rem' }}>📋</span>
            <span style={{ color: 'white', fontWeight: '700', fontSize: '1.1rem' }}>Acompanhamento de Checklists</span>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: '1300px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Cards de resumo */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Total', value: total, color: '#334155', bg: '#f1f5f9' },
            { label: 'Concluídos', value: concluidos, color: '#166534', bg: '#dcfce7' },
            { label: 'Em Andamento', value: emAndamento, color: '#1e40af', bg: '#dbeafe' },
            { label: 'Pendentes', value: pendentes, color: '#92400e', bg: '#fef3c7' },
            { label: 'Atrasados', value: atrasados, color: '#991b1b', bg: '#fee2e2' },
          ].map((card) => (
            <div key={card.label} style={{ background: card.bg, borderRadius: '0.75rem', padding: '1rem 1.25rem', border: `1px solid ${card.color}25` }}>
              <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: '600', color: card.color }}>{card.label}</p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '1.75rem', fontWeight: '800', color: card.color }}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div style={{ background: 'white', borderRadius: '1rem', padding: '1.25rem 1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="🔍 Buscar checklist, cliente, empresa, responsável..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{ ...inputStyle, flex: '1 1 240px', minWidth: '180px' }}
            />
            <select value={filtroAluno} onChange={(e) => setFiltroAluno(e.target.value)} style={inputStyle}>
              <option value="">Todos os clientes</option>
              {alunos.map((a) => (
                <option key={a.id} value={a.id}>{a.nome || `Cliente #${a.id}`}</option>
              ))}
            </select>
            <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} style={inputStyle}>
              <option value="">Todos os status</option>
              <option value="pendente">Pendente</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="concluido">Concluído</option>
              <option value="atrasado">Atrasado</option>
            </select>
          </div>
        </div>

        {/* Tabela */}
        <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
              <div style={{ width: '32px', height: '32px', border: '3px solid #f3f4f6', borderTopColor: '#334155', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 0.75rem' }} />
              Carregando...
            </div>
          ) : checklistsFiltrados.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
              Nenhum checklist encontrado com os filtros selecionados.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: '700', color: '#374151', borderBottom: '2px solid #e2e8f0' }}>Cliente</th>
                    <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: '700', color: '#374151', borderBottom: '2px solid #e2e8f0' }}>Empresa</th>
                    <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: '700', color: '#374151', borderBottom: '2px solid #e2e8f0' }}>Checklist</th>
                    <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: '700', color: '#374151', borderBottom: '2px solid #e2e8f0' }}>Responsável</th>
                    <th style={{ padding: '0.875rem 1rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: '700', color: '#374151', borderBottom: '2px solid #e2e8f0' }}>Status</th>
                    <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: '700', color: '#374151', borderBottom: '2px solid #e2e8f0' }}>Progresso</th>
                    <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: '700', color: '#374151', borderBottom: '2px solid #e2e8f0' }}>Atualizado em</th>
                  </tr>
                </thead>
                <tbody>
                  {checklistsFiltrados.map((c) => {
                    const info = statusInfo(c.status)
                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', fontWeight: '600', color: '#1f2937' }}>{c.aluno_nome}</td>
                        <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: '#6b7280' }}>{c.empresa_nome}</td>
                        <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: '#374151' }}>{c.titulo || 'Sem título'}</td>
                        <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                          {c.status === 'concluido' && c.concluido_por_nome ? c.concluido_por_nome : c.colaborador_nome}
                        </td>
                        <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                          <span style={{ padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '700', background: info.bg, color: info.text, whiteSpace: 'nowrap' }}>
                            {info.label}
                          </span>
                        </td>
                        <td style={{ padding: '0.875rem 1rem', minWidth: '120px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ flex: 1, height: '8px', borderRadius: '999px', background: '#f1f5f9', overflow: 'hidden' }}>
                              <div style={{ width: `${c.progresso}%`, height: '100%', background: c.progresso >= 100 ? '#10b981' : '#3b82f6', borderRadius: '999px' }} />
                            </div>
                            <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '600' }}>{c.progresso}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                          {c.status === 'concluido' ? formatarData(c.concluido_em) : formatarData(c.updated_at)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
