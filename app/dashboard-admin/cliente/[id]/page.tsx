'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, CheckSquare, AlertTriangle, TrendingUp, Calendar, User, Activity, History, FileText } from 'lucide-react'

interface ClienteData {
  aluno_id: number
  nome: string
  email: string | null
  ativo: boolean
  ultimo_login: string | null
  empresas: number
  checklists: { total: number; concluidos: number; mes: number }
  acoes: { total: number; concluidas: number; atrasadas: number; mes: number }
}

interface AtividadeItem {
  tipo: 'checklist' | 'acao'
  descricao: string
  data: string
  empresa?: string
}

export default function AdminClienteDashboard() {
  const router = useRouter()
  const params = useParams()
  const clienteId = params.id as string

  const [cliente, setCliente] = useState<ClienteData | null>(null)
  const [atividades, setAtividades] = useState<AtividadeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<{ acao: string; detalhe: string; created_at: string }[]>([])
  const [observacoes, setObservacoes] = useState('')
  const [salvandoObs, setSalvandoObs] = useState(false)
  const [obsSalva, setObsSalva] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) { router.push('/login'); return }
    const user = JSON.parse(userData)
    if (user.role !== 'admin') { router.push('/login'); return }
    carregarDados()
  }, [clienteId])

  async function carregarDados() {
    setLoading(true)
    try {
      const [statsRes, atividadesRes, logsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch(`/api/admin/cliente-atividades?aluno_id=${clienteId}`),
        fetch('/api/admin/log-alteracoes'),
      ])

      if (statsRes.ok) {
        const { performanceGeral } = await statsRes.json()
        const found = (performanceGeral || []).find((c: ClienteData) => String(c.aluno_id) === clienteId)
        setCliente(found || null)
      }

      if (atividadesRes.ok) {
        setAtividades(await atividadesRes.json())
      }

      if (logsRes.ok) {
        const todosLogs = await logsRes.json()
        setLogs(todosLogs.filter((l: { aluno_id: number }) => String(l.aluno_id) === clienteId))
      }

      const obsRes = await fetch(`/api/admin/clientes?id=${clienteId}`)
      if (obsRes.ok) {
        const obsData = await obsRes.json()
        setObservacoes(obsData?.observacoes ?? '')
      }
    } catch {
      // silencioso
    } finally {
      setLoading(false)
    }
  }

  function formatarData(data: string | null) {
    if (!data) return '—'
    return new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  async function salvarObservacoes() {
    setSalvandoObs(true)
    try {
      await fetch('/api/admin/clientes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: Number(clienteId), observacoes }),
      })
      setObsSalva(true)
      setTimeout(() => setObsSalva(false), 3000)
    } finally {
      setSalvandoObs(false)
    }
  }

  function calcPct(v: number, t: number) {
    return t > 0 ? Math.round((v / t) * 100) : 0
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#9ca3af' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #e5e7eb', borderTopColor: '#334155', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          Carregando...
        </div>
      </div>
    )
  }

  if (!cliente) {
    return (
      <div style={{ minHeight: '100vh', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#6b7280' }}>Cliente não encontrado.</p>
          <button onClick={() => router.push('/dashboard-admin')} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#334155', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>
            Voltar
          </button>
        </div>
      </div>
    )
  }

  const pctChecklist = calcPct(cliente.checklists.concluidos, cliente.checklists.total)
  const pctAcoes = calcPct(cliente.acoes.concluidas, cliente.acoes.total)

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <nav style={{ backgroundColor: '#334155', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', height: '4rem', gap: '1rem' }}>
          <button
            onClick={() => router.push('/dashboard-admin')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 0.875rem', color: 'white', cursor: 'pointer', fontSize: '0.875rem' }}
          >
            <ArrowLeft size={16} /> Voltar
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <User size={18} style={{ color: '#93c5fd' }} />
            <span style={{ color: 'white', fontWeight: '700', fontSize: '1.1rem' }}>
              {cliente.nome}
            </span>
            <span style={{ padding: '0.2rem 0.625rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600', background: cliente.ativo ? '#d1fae5' : '#fee2e2', color: cliente.ativo ? '#059669' : '#dc2626' }}>
              {cliente.ativo ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Info do cliente */}
        <div style={{ background: 'white', borderRadius: '1rem', padding: '1.25rem 1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '1.5rem', display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>E-mail</p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', color: '#374151' }}>{cliente.email || '—'}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Empresas</p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', color: '#374151', fontWeight: '700' }}>{cliente.empresas}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Último Login</p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', color: '#374151' }}>{formatarData(cliente.ultimo_login)}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Atividade este mês</p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', color: '#1d4ed8', fontWeight: '700' }}>{cliente.checklists.mes + cliente.acoes.mes} itens</p>
          </div>
        </div>

        {/* Cards de métricas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Checklists Total', value: cliente.checklists.total, color: '#6366f1', bg: '#eef2ff', icon: <CheckSquare size={20} /> },
            { label: 'Checklists Concluídos', value: `${cliente.checklists.concluidos} (${pctChecklist}%)`, color: '#10b981', bg: '#f0fdf4', icon: <TrendingUp size={20} /> },
            { label: 'Ações Total', value: cliente.acoes.total, color: '#8b5cf6', bg: '#f5f3ff', icon: <Activity size={20} /> },
            { label: 'Ações Concluídas', value: `${cliente.acoes.concluidas} (${pctAcoes}%)`, color: '#10b981', bg: '#f0fdf4', icon: <TrendingUp size={20} /> },
            { label: 'Ações Atrasadas', value: cliente.acoes.atrasadas, color: cliente.acoes.atrasadas > 0 ? '#ef4444' : '#10b981', bg: cliente.acoes.atrasadas > 0 ? '#fef2f2' : '#f0fdf4', icon: <AlertTriangle size={20} /> },
          ].map(card => (
            <div key={card.label} style={{ background: card.bg, borderRadius: '0.75rem', padding: '1.125rem 1.25rem', border: `1px solid ${card.color}25` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: card.color, marginBottom: '0.5rem' }}>
                {card.icon}
                <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>{card.label}</span>
              </div>
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: card.color }}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Barras de progresso */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Conclusão de Checklists', pct: pctChecklist, cor: '#6366f1' },
            { label: 'Conclusão de Ações', pct: pctAcoes, cor: '#8b5cf6' },
          ].map(barra => (
            <div key={barra.label} style={{ background: 'white', borderRadius: '0.75rem', padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>{barra.label}</span>
                <span style={{ fontSize: '0.875rem', fontWeight: '800', color: barra.cor }}>{barra.pct}%</span>
              </div>
              <div style={{ height: '10px', borderRadius: '999px', background: '#f1f5f9', overflow: 'hidden' }}>
                <div style={{ width: `${barra.pct}%`, height: '100%', background: barra.pct >= 70 ? '#10b981' : barra.pct >= 40 ? '#f59e0b' : '#ef4444', borderRadius: '999px', transition: 'width 0.4s ease' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Atividades recentes */}
        <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <Activity size={18} style={{ color: '#334155' }} />
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#1f2937' }}>Atividades Recentes</h2>
          </div>
          {atividades.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
              <Calendar size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.35 }} />
              <p style={{ margin: 0, fontSize: '0.875rem' }}>Nenhuma atividade recente</p>
            </div>
          ) : (
            <div style={{ padding: '0.5rem 0' }}>
              {atividades.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem', padding: '0.75rem 1.5rem', borderBottom: idx < atividades.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                  <span style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: '2px' }}>{item.tipo === 'checklist' ? '📋' : '⚠️'}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#1f2937' }}>{item.descricao}</p>
                    {item.empresa && <p style={{ margin: '0.125rem 0 0', fontSize: '0.75rem', color: '#6b7280' }}>🏢 {item.empresa}</p>}
                  </div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {new Date(item.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Histórico de alterações admin */}
        {logs.length > 0 && (
          <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden', marginTop: '1.5rem' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <History size={18} style={{ color: '#334155' }} />
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#1f2937' }}>Histórico de Alterações</h2>
            </div>
            <div style={{ padding: '0.5rem 0' }}>
              {logs.map((log, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.625rem 1.5rem', borderBottom: idx < logs.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                  <span style={{ fontSize: '1rem' }}>{log.acao === 'ativado' ? '✅' : '🔴'}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#374151' }}>{log.detalhe}</p>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                    {new Date(log.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Observações do admin */}
        <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden', marginTop: '1.5rem' }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <FileText size={18} style={{ color: '#334155' }} />
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#1f2937' }}>Observações Internas</h2>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginLeft: 'auto' }}>Visível apenas para administradores</span>
          </div>
          <div style={{ padding: '1.25rem 1.5rem' }}>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Anote aqui informações sobre o cliente: situação do contrato, pendências, histórico de suporte, observações importantes..."
              rows={5}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '0.75rem 1rem',
                border: '1.5px solid #e5e7eb', borderRadius: '0.5rem',
                fontSize: '0.9rem', lineHeight: '1.6',
                resize: 'vertical', outline: 'none',
                fontFamily: 'inherit', color: '#374151',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#334155' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.75rem' }}>
              {obsSalva && (
                <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: '600' }}>✓ Observação salva!</span>
              )}
              <button
                onClick={salvarObservacoes}
                disabled={salvandoObs}
                style={{
                  padding: '0.625rem 1.5rem',
                  background: salvandoObs ? '#94a3b8' : '#334155',
                  color: 'white', border: 'none', borderRadius: '0.5rem',
                  cursor: salvandoObs ? 'not-allowed' : 'pointer',
                  fontWeight: '600', fontSize: '0.875rem',
                }}
              >
                {salvandoObs ? 'Salvando...' : 'Salvar observação'}
              </button>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
