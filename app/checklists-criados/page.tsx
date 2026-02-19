'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Calendar,
  Building2,
  FileCheck,
  Eye,
  User
} from 'lucide-react'

interface ChecklistCriado {
  id: string
  titulo: string
  descricao?: string
  status: 'pendente' | 'em_andamento' | 'concluido'
  data_inicio: string
  data_fim: string
  created_at: string
  empresas?: { nome_fantasia: string }
  colaboradores?: { nome: string }
}

export default function ChecklistsCriados() {
  const router = useRouter()
  const [checklists, setChecklists] = useState<ChecklistCriado[]>([])
  const [loading, setLoading] = useState(true)
  const [empresas, setEmpresas] = useState<{ id: string; nome_fantasia: string }[]>([])
  const [filtros, setFiltros] = useState({
    empresa_id: '',
    dataInicio: '',
    dataFim: '',
    status: ''
  })

  useEffect(() => {
    verificarAutenticacao()
  }, [])

  async function verificarAutenticacao() {
    const userStr = localStorage.getItem('user')
    if (!userStr) { router.push('/login'); return }
    const user = JSON.parse(userStr)
    if (user.role !== 'aluno') { router.push('/login'); return }
    await carregarDados(user.id)
  }

  async function carregarDados(alunoId: string) {
    try {
      setLoading(true)
      const res = await fetch(`/api/aluno/checklists-criados?aluno_id=${alunoId}`)
      if (!res.ok) throw new Error('Erro ao carregar dados')
      const { empresas: emp, checklists: cl } = await res.json()
      setEmpresas(emp || [])
      setChecklists(cl || [])
    } catch (err) {
      console.error('Erro ao carregar checklists:', err)
    } finally {
      setLoading(false)
    }
  }

  const checklistsFiltrados = checklists.filter(c => {
    if (filtros.empresa_id && c.empresas?.nome_fantasia) {
      const empresa = empresas.find(e => e.id === filtros.empresa_id)
      if (empresa && c.empresas.nome_fantasia !== empresa.nome_fantasia) return false
    }
    if (filtros.status && c.status !== filtros.status) return false
    if (filtros.dataInicio && c.created_at < filtros.dataInicio) return false
    if (filtros.dataFim && c.created_at > filtros.dataFim + 'T23:59:59') return false
    return true
  })

  const getStatusStyle = (status: string) => {
    const estilos = {
      pendente: { bg: '#FFF3E0', text: '#E65100', border: '#FFB74D', label: 'Pendente' },
      em_andamento: { bg: '#E3F2FD', text: '#1565C0', border: '#64B5F6', label: 'Em Andamento' },
      concluido: { bg: '#E8F5E9', text: '#2E7D32', border: '#81C784', label: 'Concluído' }
    }
    return estilos[status as keyof typeof estilos] || estilos.pendente
  }

  const formatarData = (data: string) =>
    new Date(data).toLocaleDateString('pt-BR')

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'white', fontSize: '1rem' }}>Carregando checklists...</p>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .slide-up { animation: slideUp 0.4s ease-out; }
        .card-hover { transition: all 0.2s ease; }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.12) !important; }
      `}</style>

      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>

        {/* Header */}
        <div style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.3)', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button
              onClick={() => router.push('/dashboard-aluno')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '600', boxShadow: '0 4px 12px rgba(102,126,234,0.4)', transition: 'all 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
            >
              <ArrowLeft size={18} />
              Voltar
            </button>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: '800', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                Checklists Criados
              </h1>
              <p style={{ fontSize: '0.95rem', color: '#64748b', margin: '0.25rem 0 0', fontWeight: '500' }}>
                Visualize e acompanhe todos os checklists cadastrados
              </p>
            </div>
          </div>
        </div>

        <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '2.5rem 2rem' }}>

          {/* Filtros */}
          <div className="slide-up" style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '20px', padding: '2rem', marginBottom: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>

              {/* Empresa */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.5rem' }}>
                  Empresa
                </label>
                <div style={{ position: 'relative' }}>
                  <Building2 style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', width: '18px', height: '18px', pointerEvents: 'none' }} />
                  <select
                    value={filtros.empresa_id}
                    onChange={(e) => setFiltros({ ...filtros, empresa_id: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.75rem', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '0.875rem', outline: 'none', backgroundColor: 'white', cursor: 'pointer' }}
                  >
                    <option value="">Todas as empresas</option>
                    {empresas.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.nome_fantasia}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.5rem' }}>
                  Status
                </label>
                <select
                  value={filtros.status}
                  onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '0.875rem', outline: 'none', backgroundColor: 'white', cursor: 'pointer' }}
                >
                  <option value="">Todos os status</option>
                  <option value="pendente">Pendente</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="concluido">Concluído</option>
                </select>
              </div>

              {/* Data início */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.5rem' }}>
                  A partir de
                </label>
                <div style={{ position: 'relative' }}>
                  <Calendar style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', width: '18px', height: '18px', pointerEvents: 'none' }} />
                  <input
                    type="date"
                    value={filtros.dataInicio}
                    onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.75rem', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '0.875rem', outline: 'none', backgroundColor: 'white' }}
                  />
                </div>
              </div>

              {/* Data fim */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.5rem' }}>
                  Até
                </label>
                <div style={{ position: 'relative' }}>
                  <Calendar style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', width: '18px', height: '18px', pointerEvents: 'none' }} />
                  <input
                    type="date"
                    value={filtros.dataFim}
                    onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.75rem', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '0.875rem', outline: 'none', backgroundColor: 'white' }}
                  />
                </div>
              </div>

              {/* Limpar filtros */}
              <button
                onClick={() => setFiltros({ empresa_id: '', dataInicio: '', dataFim: '', status: '' })}
                style={{ padding: '0.75rem 1.25rem', background: '#f1f5f9', color: '#475569', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#f1f5f9'}
              >
                Limpar filtros
              </button>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#94a3b8', fontStyle: 'italic', margin: '1.5rem 0 0' }}>
              {checklistsFiltrados.length} checklist{checklistsFiltrados.length !== 1 ? 's' : ''} encontrado{checklistsFiltrados.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Lista */}
          <div className="slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {checklistsFiltrados.length === 0 ? (
              <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '20px', padding: '5rem 2rem', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <div style={{ width: '100px', height: '100px', margin: '0 auto 2rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(-5deg)' }}>
                  <FileCheck size={50} style={{ color: 'white' }} />
                </div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1e293b', margin: '0 0 0.75rem' }}>
                  Nenhum checklist encontrado
                </h2>
                <p style={{ fontSize: '1rem', color: '#64748b', margin: 0 }}>
                  {checklists.length === 0 ? 'Nenhum checklist foi criado ainda.' : 'Nenhum checklist corresponde aos filtros selecionados.'}
                </p>
              </div>
            ) : (
              checklistsFiltrados.map((checklist) => {
                const statusStyle = getStatusStyle(checklist.status)
                return (
                  <div
                    key={checklist.id}
                    className="card-hover"
                    style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '16px', padding: '1.75rem 2rem', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}
                  >
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: '280px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.625rem', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>
                          {checklist.titulo}
                        </h3>
                        <span style={{ padding: '0.25rem 0.75rem', background: statusStyle.bg, color: statusStyle.text, border: `1.5px solid ${statusStyle.border}`, borderRadius: '999px', fontSize: '0.75rem', fontWeight: '700' }}>
                          {statusStyle.label}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                        {checklist.empresas && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: '#64748b' }}>
                            <Building2 size={14} />
                            {checklist.empresas.nome_fantasia}
                          </span>
                        )}
                        {checklist.colaboradores && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: '#64748b' }}>
                            <User size={14} />
                            {checklist.colaboradores.nome}
                          </span>
                        )}
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: '#64748b' }}>
                          <Calendar size={14} />
                          Até {formatarData(checklist.data_fim)}
                        </span>
                      </div>
                    </div>

                    {/* Botão Ver Detalhes */}
                    <button
                      onClick={() => router.push(`/checklists-criados/${checklist.id}`)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600', boxShadow: '0 4px 12px rgba(102,126,234,0.35)', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(102,126,234,0.5)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(102,126,234,0.35)'; }}
                    >
                      <Eye size={16} />
                      Ver Detalhes
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </main>
      </div>
    </>
  )
}
