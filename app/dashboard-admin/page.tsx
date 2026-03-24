'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckSquare, FileText, ChevronDown, Menu, X, LogOut, User, Building2, CheckCircle, XCircle, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Aluno {
  id: number
  clientes: string
  'e-mail': string
  programa: string
  ativo: boolean
}

export default function DashboardAdmin() {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [userName, setUserName] = useState('')
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [loadingAlunos, setLoadingAlunos] = useState(true)
  const [toggling, setToggling] = useState<number | null>(null)

  async function carregarAlunos() {
    const { data } = await supabase
      .from('alunos')
      .select('*')
      .order('clientes')
    setAlunos(data || [])
    setLoadingAlunos(false)
  }

  async function toggleAtivo(aluno: Aluno) {
    setToggling(aluno.id)
    const novoStatus = !aluno.ativo
    const { error } = await supabase
      .from('alunos')
      .update({ ativo: novoStatus })
      .eq('id', aluno.id)
    if (!error) {
      setAlunos((prev) => prev.map((a) => (a.id === aluno.id ? { ...a, ativo: novoStatus } : a)))
    }
    setToggling(null)
  }

  useEffect(() => {
    // ✅ VERIFICAÇÃO ATUALIZADA
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }
    const user = JSON.parse(userData)
    if (user.role !== 'admin') {
      if (user.role === 'colaborador') {
        window.location.href = '/dashboard-funcionario'
      } else {
        window.location.href = '/dashboard-aluno'
      }
      return
    }
    setUserName(user.full_name || user.email)
    carregarAlunos()
  }, [router])

  const menuItems = [
    {
      title: 'Organização',
      submenu: [
        { label: 'Visão Geral', href: '/organizacao' },
        { label: 'Grupos de Empresa', href: '/organizacao/grupos-empresa' },
        { label: 'Colaboradores', href: '/organizacao/colaboradores' },
        { label: 'Copilotos', href: '/organizacao/copilotos' },
        { label: 'Tipos de Negócio', href: '/organizacao/tipos-negocio' },
      ]
    },
    {
      title: 'Sistema',
      submenu: [
        { label: 'Usuários', href: '/usuarios' },
        { label: 'Tutorial', href: '/tutorial' },
      ]
    }
  ]

  const handleLogout = async () => {
    localStorage.removeItem('user')
    await fetch('/api/auth/logout', { method: 'POST' })
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
      `}</style>

      <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
        <nav style={{ backgroundColor: '#334155', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '4.5rem' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '3rem', height: '3rem', borderRadius: '0.75rem', overflow: 'hidden', backgroundColor: 'white' }}>
                  <img src="/logo-semerro.jpg" alt="Performe seu Mercado" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>Performe seu Mercado - ADMIN</span>
              </div>

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

              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="mobile-menu-btn" style={{ padding: '0.5rem', color: 'white', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}>
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </nav>

        <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
              Bem-vindo, {userName}!
            </h1>
            <p style={{ color: '#6b7280' }}>Painel de Administração</p>
          </div>

          {/* Cards de resumo */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {[
              { label: 'Total de Clientes', value: alunos.length, color: '#3b82f6', bg: '#eff6ff', icon: <Building2 size={20} /> },
              { label: 'Ativos', value: alunos.filter((a) => a.ativo).length, color: '#10b981', bg: '#f0fdf4', icon: <CheckCircle size={20} /> },
              { label: 'Inativos', value: alunos.filter((a) => !a.ativo).length, color: '#ef4444', bg: '#fef2f2', icon: <XCircle size={20} /> },
              { label: 'Colaboradores', value: '—', color: '#8b5cf6', bg: '#f5f3ff', icon: <Users size={20} />, href: '/organizacao/colaboradores' },
            ].map((card) => (
              <div
                key={card.label}
                onClick={card.href ? () => router.push(card.href!) : undefined}
                style={{
                  backgroundColor: card.bg, borderRadius: '0.75rem',
                  padding: '1.25rem 1.5rem', border: `1px solid ${card.color}30`,
                  cursor: card.href ? 'pointer' : 'default'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: card.color, marginBottom: '0.5rem' }}>
                  {card.icon}
                  <span style={{ fontSize: '0.8rem', fontWeight: '500' }}>{card.label}</span>
                </div>
                <p style={{ color: card.color, fontSize: '1.75rem', fontWeight: 'bold', margin: 0 }}>{card.value}</p>
              </div>
            ))}
          </div>

          {/* Lista de empresas com ativo/desativo */}
          <div style={{ backgroundColor: 'white', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Building2 size={22} style={{ color: 'white' }} />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: 'white' }}>Clientes / Grupos de Empresa</h2>
              </div>
              <button
                onClick={() => router.push('/organizacao/grupos-empresa')}
                style={{ padding: '0.375rem 0.875rem', backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Ver todos
              </button>
            </div>

            {loadingAlunos ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>Carregando...</div>
            ) : alunos.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
                <CheckSquare size={40} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
                <p>Nenhum cliente cadastrado</p>
              </div>
            ) : (
              <div style={{ padding: '1rem', display: 'grid', gap: '0.5rem' }}>
                {alunos.slice(0, 10).map((aluno) => (
                  <div
                    key={aluno.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.875rem 1rem', borderRadius: '0.5rem',
                      border: `1px solid ${aluno.ativo ? '#d1fae5' : '#fee2e2'}`,
                      backgroundColor: aluno.ativo ? '#f0fdf4' : '#fef2f2',
                      flexWrap: 'wrap'
                    }}
                  >
                    {aluno.ativo
                      ? <CheckCircle size={18} style={{ color: '#10b981', flexShrink: 0 }} />
                      : <XCircle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
                    }
                    <div style={{ flex: 1, minWidth: '120px' }}>
                      <p style={{ margin: 0, fontWeight: '600', color: '#1f2937', fontSize: '0.9rem' }}>{aluno.clientes || 'Sem nome'}</p>
                      <p style={{ margin: 0, color: '#6b7280', fontSize: '0.8rem' }}>{aluno['e-mail'] || ''}{aluno.programa ? ` • ${aluno.programa}` : ''}</p>
                    </div>
                    <button
                      onClick={() => toggleAtivo(aluno)}
                      disabled={toggling === aluno.id}
                      style={{
                        padding: '0.375rem 0.875rem', border: 'none', borderRadius: '0.375rem',
                        cursor: toggling === aluno.id ? 'not-allowed' : 'pointer',
                        fontWeight: '600', fontSize: '0.8rem',
                        backgroundColor: toggling === aluno.id ? '#e5e7eb' : aluno.ativo ? '#fee2e2' : '#d1fae5',
                        color: toggling === aluno.id ? '#9ca3af' : aluno.ativo ? '#dc2626' : '#059669',
                      }}
                    >
                      {toggling === aluno.id ? '...' : aluno.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                  </div>
                ))}
                {alunos.length > 10 && (
                  <button
                    onClick={() => router.push('/organizacao/grupos-empresa')}
                    style={{ padding: '0.75rem', textAlign: 'center', backgroundColor: '#f9fafb', border: '1px dashed #e5e7eb', borderRadius: '0.5rem', cursor: 'pointer', color: '#6b7280', fontSize: '0.875rem' }}
                  >
                    Ver mais {alunos.length - 10} clientes →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Cards de ações rápidas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
            <div
              onClick={() => router.push('/organizacao/colaboradores')}
              style={{ backgroundColor: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', cursor: 'pointer', border: '2px solid transparent', transition: 'all 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <Users size={32} style={{ color: '#10b981', marginBottom: '0.75rem' }} />
              <h3 style={{ fontWeight: '600', color: '#1f2937', margin: '0 0 0.375rem' }}>Colaboradores</h3>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>Cadastre colaboradores nas empresas</p>
            </div>
            <div
              onClick={() => router.push('/performance')}
              style={{ backgroundColor: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', cursor: 'pointer', border: '2px solid transparent', transition: 'all 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <FileText size={32} style={{ color: '#3b82f6', marginBottom: '0.75rem' }} />
              <h3 style={{ fontWeight: '600', color: '#1f2937', margin: '0 0 0.375rem' }}>Relatórios</h3>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>Performance e relatórios gerais</p>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}