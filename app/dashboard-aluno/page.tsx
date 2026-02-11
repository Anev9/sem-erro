'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckSquare, FileText, ChevronDown, Menu, X, LogOut, User, Calendar, TrendingUp, AlertCircle } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

// Inicializar Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Checklist {
  id: string
  nome: string
  descricao: string | null
  tipo_negocio: string | null
  status: string
  proxima_execucao: string | null
  created_at: string
}

interface PerformanceData {
  empresa: string
  total: number
  concluidos: number
  pendentes: number
  percentual: number
}

export default function DashboardAluno() {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [performance, setPerformance] = useState<PerformanceData[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')

  const menuItems = [
    {
      title: 'Ações',
      submenu: [{ label: 'Ações', href: '/acoes' }]
    },
    {
      title: 'Checklist',
      submenu: [
        { label: 'Checklists futuros', href: '/checklists-futuros' },
        { label: 'Checklists criados', href: '/checklists-criados' },
        { label: 'Upload checklist excel', href: '/upload-questionarios' },
        { label: 'Alertas adicionais', href: '/alertas-adicionais' },
      ]
    },
    {
      title: 'Organização',
      submenu: [
        { label: 'Colaboradores', href: '/colaboradores' },
        { label: 'Minhas empresas', href: '/minhas-empresas' },
      ]
    },
    {
      title: 'Relatórios',
      submenu: [
        { label: 'Performance dos funcionários', href: '/performance-funcionarios' },
        { label: 'Respostas', href: '/respostas' },
        { label: 'Resultados checklist', href: '/resultados-checklist' },
        { label: 'Feitos por empresa', href: '/feitos-por-empresa' },
        { label: 'Indicador', href: '/indicador' },
        { label: 'Feitos por departamento', href: '/feitos-por-departamento' },
      ]
    }
  ]

  useEffect(() => {
    // ✅ VERIFICAÇÃO ATUALIZADA
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }
    const user = JSON.parse(userData)
    // Se for admin, redireciona para dashboard admin
    if (user.role === 'admin') {
      router.push('/dashboard-admin')
      return
    }
    setUserName(user.full_name || user.email)
    buscarDados()
  }, [router])

  async function buscarDados() {
    try {
      setLoading(true)

      // Buscar checklists dos últimos 30 dias
      const dataLimite = new Date()
      dataLimite.setDate(dataLimite.getDate() - 30)

      const { data: checklistsData, error: checklistsError } = await supabase
        .from('checklists')
        .select('*')
        .gte('created_at', dataLimite.toISOString())
        .order('created_at', { ascending: false })
        .limit(10)

      if (checklistsError) throw checklistsError
      setChecklists(checklistsData || [])

      // Buscar dados de performance por empresa/tipo
      await buscarPerformance()

    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  async function buscarPerformance() {
    try {
      // Buscar todos os checklists agrupados por tipo de negócio
      const { data: checklistsData, error } = await supabase
        .from('checklists')
        .select('id, tipo_negocio, status')

      if (error) throw error

      // Agrupar dados por tipo de negócio
      const agrupado: { [key: string]: { total: number; concluidos: number; pendentes: number } } = {}

      checklistsData?.forEach(checklist => {
        const tipo = checklist.tipo_negocio || 'Sem categoria'
        
        if (!agrupado[tipo]) {
          agrupado[tipo] = { total: 0, concluidos: 0, pendentes: 0 }
        }
        
        agrupado[tipo].total++
        
        if (checklist.status === 'concluido') {
          agrupado[tipo].concluidos++
        } else {
          agrupado[tipo].pendentes++
        }
      })

      // Converter para array e calcular percentuais
      const performanceArray: PerformanceData[] = Object.entries(agrupado).map(([empresa, dados]) => ({
        empresa,
        total: dados.total,
        concluidos: dados.concluidos,
        pendentes: dados.pendentes,
        percentual: dados.total > 0 ? Math.round((dados.concluidos / dados.total) * 100) : 0
      }))

      setPerformance(performanceArray)
    } catch (error) {
      console.error('Erro ao buscar performance:', error)
    }
  }

  function formatarData(data: string) {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  function obterCorStatus(status: string) {
    switch (status) {
      case 'concluido':
        return { bg: '#dcfce7', text: '#166534', label: 'Concluído' }
      case 'ativo':
        return { bg: '#dbeafe', text: '#1e40af', label: 'Ativo' }
      case 'pendente':
        return { bg: '#fef3c7', text: '#92400e', label: 'Pendente' }
      default:
        return { bg: '#f3f4f6', text: '#374151', label: status }
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/login')
  }

  return (
    <>
      <style>{`
        .dropdown-menu { animation: slideDown 0.2s ease-out; }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .desktop-menu { display: none; }
        @media (min-width: 768px) {
          .desktop-menu { display: flex !important; }
          .mobile-menu-btn { display: none !important; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
        {/* Navbar */}
        <nav style={{ backgroundColor: '#334155', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '4.5rem' }}>
              
              {/* Logo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '3rem', height: '3rem', borderRadius: '0.75rem', overflow: 'hidden', backgroundColor: 'white' }}>
                  <img src="/logo-semerro.jpg" alt="Sem Erro" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>SEM ERRO</span>
              </div>

              {/* Menu Desktop */}
              <div className="desktop-menu" style={{ gap: '0.5rem', alignItems: 'center' }}>
                {menuItems.map((item) => (
                  <div key={item.title} style={{ position: 'relative' }}
                    onMouseEnter={() => setActiveDropdown(item.title)}
                    onMouseLeave={() => setActiveDropdown(null)}>
                    
                    <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1rem', color: 'white', backgroundColor: activeDropdown === item.title ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '500' }}>
                      {item.title}
                      <ChevronDown size={16} />
                    </button>

                    {activeDropdown === item.title && (
                      <div className="dropdown-menu" style={{ position: 'absolute', top: '100%', left: 0, backgroundColor: 'white', borderRadius: '0.75rem', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', minWidth: '220px', overflow: 'hidden', zIndex: 1000, padding: '0.5rem 0' }}>
                        {item.submenu.map((sub) => (
                          <button key={sub.label} onClick={() => router.push(sub.href)} style={{ width: '100%', padding: '0.75rem 1rem', color: '#374151', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; e.currentTarget.style.paddingLeft = '1.25rem'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.paddingLeft = '1rem'; }}>
                            {sub.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                <div style={{ display: 'flex', gap: '1rem', marginLeft: '1rem', paddingLeft: '1rem', borderLeft: '1px solid rgba(255,255,255,0.2)' }}>
                  <button onClick={() => router.push('/alterar-senha')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', color: 'white', backgroundColor: 'transparent', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>
                    <User size={18} />
                    Perfil
                  </button>
                  <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', color: 'white', backgroundColor: '#ef4444', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '500' }}>
                    <LogOut size={18} />
                    Sair
                  </button>
                </div>
              </div>

              {/* Botão Menu Mobile */}
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="mobile-menu-btn" style={{ padding: '0.5rem', color: 'white', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}>
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>

            {/* Menu Mobile Expandido */}
            {mobileMenuOpen && (
              <div style={{ 
                paddingBottom: '1rem',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                marginTop: '0.5rem'
              }}>
                {menuItems.map((item) => (
                  <div key={item.title} style={{ marginTop: '0.5rem' }}>
                    <div style={{ 
                      padding: '0.75rem 1rem',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '0.9rem'
                    }}>
                      {item.title}
                    </div>
                    {item.submenu.map((sub) => (
                      <button 
                        key={sub.label}
                        onClick={() => {
                          router.push(sub.href)
                          setMobileMenuOpen(false)
                        }}
                        style={{
                          width: '100%',
                          padding: '0.625rem 2rem',
                          color: 'rgba(255,255,255,0.8)',
                          backgroundColor: 'transparent',
                          border: 'none',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                ))}
                <div style={{ 
                  marginTop: '1rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  gap: '0.5rem',
                  padding: '0 1rem'
                }}>
                  <button 
                    onClick={() => router.push('/alterar-senha')}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      color: 'white',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: 'pointer'
                    }}
                  >
                    Perfil
                  </button>
                  <button 
                    onClick={handleLogout}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      color: 'white',
                      backgroundColor: '#ef4444',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: 'pointer'
                    }}
                  >
                    Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Conteúdo Principal */}
        <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
              Bem-vindo, {userName}!
            </h1>
            <p style={{ color: '#6b7280' }}>Painel do Cliente</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            
            {/* Card: Checklists dos Últimos 30 Dias */}
            <div style={{ backgroundColor: 'white', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', padding: '1.5rem', color: 'white' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Checklists dos Últimos 30 Dias</h2>
              </div>
              <div style={{ padding: '1.5rem', maxHeight: '500px', overflowY: 'auto' }}>
                {loading ? (
                  <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem 0' }}>
                    <div style={{ 
                      width: '40px',
                      height: '40px',
                      border: '4px solid #f3f4f6',
                      borderTopColor: '#8b5cf6',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto 1rem'
                    }} />
                    <p>Carregando...</p>
                  </div>
                ) : checklists.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#9ca3af' }}>
                    <CheckSquare size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                    <p style={{ margin: 0 }}>Nenhum checklist cadastrado ainda</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {checklists.map((checklist) => {
                      const statusInfo = obterCorStatus(checklist.status)
                      return (
                        <div 
                          key={checklist.id}
                          onClick={() => router.push(`/checklist/${checklist.id}`)}
                          style={{
                            padding: '1rem',
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.75rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#8b5cf6'
                            e.currentTarget.style.boxShadow = '0 4px 6px rgba(139, 92, 246, 0.1)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#e5e7eb'
                            e.currentTarget.style.boxShadow = 'none'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                            <h3 style={{ 
                              fontSize: '1rem',
                              fontWeight: '600',
                              color: '#1f2937',
                              margin: 0
                            }}>
                              {checklist.nome}
                            </h3>
                            <span style={{
                              padding: '0.25rem 0.75rem',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              backgroundColor: statusInfo.bg,
                              color: statusInfo.text
                            }}>
                              {statusInfo.label}
                            </span>
                          </div>
                          {checklist.descricao && (
                            <p style={{
                              fontSize: '0.875rem',
                              color: '#6b7280',
                              margin: '0.5rem 0',
                              lineHeight: '1.4'
                            }}>
                              {checklist.descricao}
                            </p>
                          )}
                          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8125rem', color: '#9ca3af', marginTop: '0.75rem' }}>
                            {checklist.tipo_negocio && (
                              <span>📋 {checklist.tipo_negocio}</span>
                            )}
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Calendar size={14} />
                              {formatarData(checklist.created_at)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Card: Performance das Empresas */}
            <div style={{ backgroundColor: 'white', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', padding: '1.5rem', color: 'white' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Performance por Tipo de Negócio</h2>
              </div>
              <div style={{ padding: '1.5rem' }}>
                {loading ? (
                  <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem 0' }}>
                    <div style={{ 
                      width: '40px',
                      height: '40px',
                      border: '4px solid #f3f4f6',
                      borderTopColor: '#8b5cf6',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto 1rem'
                    }} />
                    <p>Carregando...</p>
                  </div>
                ) : performance.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#9ca3af', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div>
                      <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                      <p>Nenhum dado de performance disponível</p>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {performance.map((item, index) => (
                      <div key={index}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.95rem' }}>
                            {item.empresa}
                          </span>
                          <span style={{ 
                            fontWeight: 'bold',
                            color: item.percentual >= 80 ? '#16a34a' : item.percentual >= 50 ? '#f59e0b' : '#ef4444',
                            fontSize: '1rem'
                          }}>
                            {item.percentual}%
                          </span>
                        </div>
                        
                        {/* Barra de progresso */}
                        <div style={{ 
                          width: '100%',
                          height: '0.75rem',
                          backgroundColor: '#f3f4f6',
                          borderRadius: '9999px',
                          overflow: 'hidden',
                          marginBottom: '0.5rem'
                        }}>
                          <div style={{
                            width: `${item.percentual}%`,
                            height: '100%',
                            background: item.percentual >= 80 
                              ? 'linear-gradient(90deg, #16a34a, #22c55e)' 
                              : item.percentual >= 50 
                              ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                              : 'linear-gradient(90deg, #ef4444, #f87171)',
                            transition: 'width 0.5s ease'
                          }} />
                        </div>

                        {/* Stats */}
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8125rem', color: '#6b7280' }}>
                          <span>Total: {item.total}</span>
                          <span style={{ color: '#16a34a' }}>✓ {item.concluidos}</span>
                          <span style={{ color: '#f59e0b' }}>⏳ {item.pendentes}</span>
                        </div>
                      </div>
                    ))}

                    {/* Resumo total */}
                    <div style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      backgroundColor: '#f9fafb',
                      borderRadius: '0.75rem',
                      borderLeft: '4px solid #8b5cf6'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <TrendingUp size={18} style={{ color: '#8b5cf6' }} />
                        <span style={{ fontWeight: '600', color: '#1f2937' }}>Resumo Geral</span>
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.6' }}>
                        <p style={{ margin: '0.25rem 0' }}>
                          Total de categorias: {performance.length}
                        </p>
                        <p style={{ margin: '0.25rem 0' }}>
                          Total de checklists: {performance.reduce((acc, item) => acc + item.total, 0)}
                        </p>
                        <p style={{ margin: '0.25rem 0' }}>
                          Taxa média de conclusão: {performance.length > 0 
                            ? Math.round(performance.reduce((acc, item) => acc + item.percentual, 0) / performance.length)
                            : 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </main>
      </div>
    </>
  )
}