'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  CheckSquare, 
  FolderOpen, 
  FileText, 
  Settings,
  ChevronDown,
  Menu,
  X,
  LogOut,
  User
} from 'lucide-react'

export default function DashboardAdmin() {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [closeTimeout, setCloseTimeout] = useState<NodeJS.Timeout | null>(null)

  const menuItems = [
    {
      title: 'Ações',
      icon: LayoutDashboard,
      submenu: [
        { label: 'Ações', href: '/acoes' },
      ]
    },
    {
      title: 'Checklist',
      icon: CheckSquare,
      submenu: [
        { label: 'Checklists futuros', href: '/checklists-futuros' },
        { label: 'Checklists que foram criados', href: '/checklists-criados' },
        { label: 'Upload checklist excell', href: '/upload-questionarios' },
        { label: 'Alertas adicionais', href: '/alertas-adicionais' },
      ]
    },
    {
      title: 'Organização',
      icon: FolderOpen,
      submenu: [
        { label: 'Colaboradores', href: '/colaboradores' },
        { label: 'Minhas empresas', href: '/minhas-empresas' },
      ]
    },
    {
      title: 'Relatórios',
      icon: FileText,
      submenu: [
        { label: 'Performance dos funcionários', href: '/performance-funcionarios' },
        { label: 'Respostas', href: '/respostas' },
        { label: 'Resultados checklist', href: '/resultados-checklist' },
        { label: 'Feitos por empresa', href: '/feitos-por-empresa' },
        { label: 'Indicador', href: '/indicador' },
        { label: 'Feitos por departamento', href: '/feitos-por-departamento' },
      ]
    },
    {
      title: 'Sistema',
      icon: Settings,
      submenu: [
        { label: 'Usuários', href: '#' },
        { label: 'Passo a passo', href: '#' },
      ]
    }
  ]

  const handleMouseEnter = (title: string) => {
    if (closeTimeout) {
      clearTimeout(closeTimeout)
      setCloseTimeout(null)
    }
    setActiveDropdown(title)
  }

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setActiveDropdown(null)
    }, 500)
    setCloseTimeout(timeout)
  }

  const handleMenuItemClick = (href: string) => {
    if (closeTimeout) {
      clearTimeout(closeTimeout)
    }
    setActiveDropdown(null)
    if (href !== '#') {
      router.push(href)
    }
  }

  const checklistData: Array<{ empresa: string; status: string; data: string }> = []

  return ( 
    <>
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dropdown-menu {
          animation: slideDown 0.2s ease-out;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .status-concluido {
          background-color: #d1fae5;
          color: #065f46;
        }

        .status-pendente {
          background-color: #fee2e2;
          color: #991b1b;
        }

        .status-progresso {
          background-color: #fef3c7;
          color: #92400e;
        }

        .desktop-menu {
          display: none;
        }

        .mobile-menu-btn {
          display: block;
        }

        @media (min-width: 768px) {
          .desktop-menu {
            display: flex !important;
          }
          .mobile-menu-btn {
            display: none !important;
          }
        }

        .mobile-menu {
          display: none;
        }

        .mobile-menu.open {
          display: block;
        }

        .menu-item-wrapper {
          position: relative;
        }

        .menu-item-wrapper::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          height: 0.25rem;
          background: transparent;
        }
      )}
      `}</style>

      <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
        <nav style={{
          backgroundColor: '#334155',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}>
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '0 1.5rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: '4.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  borderRadius: '0.75rem',
                  overflow: 'hidden',
                  backgroundColor: 'white'
                }}>
                  <img 
                    src="/logo-semerro.jpg" 
                    alt="Sem Erro"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>
                <span style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: 'white',
                  letterSpacing: '0.05em'
                }}>
                  SEM ERRO
                </span>
              </div>

              {/* Menu Desktop */}
              <div className="desktop-menu" style={{
                gap: '0.5rem',
                alignItems: 'center'
              }}>
                {menuItems.map((item) => (
                  <div 
                    key={item.title}
                    className="menu-item-wrapper"
                    onMouseEnter={() => handleMouseEnter(item.title)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <button style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.625rem 1rem',
                      color: 'white',
                      backgroundColor: activeDropdown === item.title ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}>
                      {item.title}
                      <ChevronDown size={16} />
                    </button>

                    {activeDropdown === item.title && (
                      <div 
                        className="dropdown-menu"
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          marginTop: '0rem',
                          backgroundColor: 'white',
                          borderRadius: '0.75rem',
                          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                          minWidth: '220px',
                          overflow: 'hidden',
                          zIndex: 1000,
                          paddingTop: '0.5rem',
                          paddingBottom: '0.5rem'
                        }}
                      >
                        {item.submenu.map((subItem) => (
                          <button
                            key={subItem.label}
                            onClick={() => handleMenuItemClick(subItem.href)}
                            style={{
                              width: '100%',
                              display: 'block',
                              padding: '0.75rem 1rem',
                              color: '#374151',
                              textDecoration: 'none',
                              fontSize: '0.9rem',
                              transition: 'all 0.2s ease',
                              border: 'none',
                              backgroundColor: 'transparent',
                              cursor: 'pointer',
                              textAlign: 'left'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#f3f4f6'
                              e.currentTarget.style.paddingLeft = '1.25rem'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                              e.currentTarget.style.paddingLeft = '1rem'
                            }}
                          >
                            {subItem.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginLeft: '1rem',
                  paddingLeft: '1rem',
                  borderLeft: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  <button
                    onClick={() => router.push('/alterar-senha')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      color: 'white',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <User size={18} />
                    Perfil
                  </button>
                  <button
                    onClick={() => router.push('/login')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      color: 'white',
                      backgroundColor: '#ef4444',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
                  >
                    <LogOut size={18} />
                    Sair
                  </button>
                </div>
              </div>

              {/* Botão Menu Mobile */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="mobile-menu-btn"
                style={{
                  padding: '0.5rem',
                  color: 'white',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>

            {/* Menu Mobile */}
            {mobileMenuOpen && (
              <div className="mobile-menu open" style={{
                paddingBottom: '1rem'
              }}>
                {menuItems.map((item) => (
                  <div key={item.title} style={{ marginBottom: '0.5rem' }}>
                    <button
                      onClick={() => setActiveDropdown(
                        activeDropdown === item.title ? null : item.title
                      )}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        color: 'white',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: '500'
                      }}
                    >
                      <span>{item.title}</span>
                      <ChevronDown 
                        size={18} 
                        style={{
                          transform: activeDropdown === item.title ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease'
                        }}
                      />
                    </button>
                    
                    {activeDropdown === item.title && (
                      <div style={{
                        marginTop: '0.5rem',
                        marginLeft: '1rem'
                      }}>
                        {item.submenu.map((subItem) => (
                          <button
                            key={subItem.label}
                            onClick={() => {
                              handleMenuItemClick(subItem.href)
                              setMobileMenuOpen(false)
                            }}
                            style={{
                              width: '100%',
                              display: 'block',
                              padding: '0.625rem 1rem',
                              color: 'white',
                              backgroundColor: 'transparent',
                              border: 'none',
                              borderRadius: '0.5rem',
                              cursor: 'pointer',
                              textAlign: 'left',
                              fontSize: '0.9rem',
                              transition: 'background-color 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            {subItem.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                
                <div style={{
                  marginTop: '1rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <button
                    onClick={() => {
                      router.push('/alterar-senha')
                      setMobileMenuOpen(false)
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1rem',
                      color: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '1rem'
                    }}
                  >
                    <User size={18} />
                    Perfil
                  </button>
                  <button
                    onClick={() => {
                      router.push('/login')
                      setMobileMenuOpen(false)
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1rem',
                      color: 'white',
                      backgroundColor: '#ef4444',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: '500'
                    }}
                  >
                    <LogOut size={18} />
                    Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        </nav>

        <main style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '2rem 1.5rem'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '1rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              overflow: 'hidden'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                padding: '1.5rem',
                color: 'white'
              }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  margin: 0
                }}>
                  Checklists dos Últimos 30 Dias
                </h2>
              </div>
              <div style={{ padding: '1.5rem' }}>
                {checklistData.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '3rem 1rem',
                    color: '#9ca3af'
                  }}>
                    <CheckSquare size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
                    <p style={{ fontSize: '1rem', margin: '0 0 0.5rem 0' }}>
                      Nenhum checklist cadastrado ainda
                    </p>
                    <p style={{ fontSize: '0.875rem', margin: 0 }}>
                      Os checklists aparecerão aqui quando forem criados
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {checklistData.map((item, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem',
                        backgroundColor: '#f9fafb',
                        borderRadius: '0.5rem',
                        border: '1px solid #e5e7eb'
                      }}>
                        <div>
                          <p style={{ fontWeight: '600', color: '#1f2937', margin: '0 0 0.25rem 0' }}>
                            {item.empresa}
                          </p>
                          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                            {item.data}
                          </p>
                        </div>
                        <span className={`status-badge status-${
                          item.status === 'Concluído' ? 'concluido' : 
                          item.status === 'Pendente' ? 'pendente' : 'progresso'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{
              backgroundColor: 'white',
              borderRadius: '1rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              overflow: 'hidden'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                padding: '1.5rem',
                color: 'white'
              }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  margin: 0
                }}>
                  Performance das Empresas
                </h2>
              </div>
              <div style={{ 
                padding: '1.5rem',
                minHeight: '400px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  textAlign: 'center',
                  color: '#9ca3af'
                }}>
                  <FileText size={48} style={{ margin: '0 auto 1rem auto' }} />
                  <p style={{ fontSize: '1rem' }}>
                    Gráfico de performance será exibido aqui
                  </p>
                  <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    Integração com biblioteca de gráficos em desenvolvimento
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div style={{
            marginTop: '3rem',
            textAlign: 'right',
            color: '#f97316',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
          
          </div>
        </main>
      </div>
    </>
  )}