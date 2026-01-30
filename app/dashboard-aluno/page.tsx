'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckSquare, FileText, ChevronDown, Menu, X, LogOut, User } from 'lucide-react'

export default function DashboardAluno() {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

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
                  <img src="/logo-semerro.jpg" alt="Sem Erro" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>SEM ERRO</span>
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
                  <button onClick={() => router.push('/login')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', color: 'white', backgroundColor: '#ef4444', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '500' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            
            <div style={{ backgroundColor: 'white', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', padding: '1.5rem', color: 'white' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Checklists dos Últimos 30 Dias</h2>
              </div>
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#9ca3af' }}>
                <CheckSquare size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p style={{ margin: 0 }}>Nenhum checklist cadastrado ainda</p>
              </div>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', padding: '1.5rem', color: 'white' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Performance das Empresas</h2>
              </div>
              <div style={{ padding: '1.5rem', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#9ca3af' }}>
                <div>
                  <FileText size={48} style={{ margin: '0 auto 1rem' }} />
                  <p>Gráfico de performance será exibido aqui</p>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </>
  )
}