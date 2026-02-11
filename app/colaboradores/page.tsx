'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { 
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Mail,
  Phone,
  Info,
  ArrowLeft
} from 'lucide-react'

export default function CadastroFuncionarios() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [funcionarios, setFuncionarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Buscar funcionários do Supabase
  useEffect(() => {
    async function fetchFuncionarios() {
      const supabase = createClient(
        'https://cyqiagacrmrsazhvrbgb.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5cWlhZ2Fjcm1yc2F6aHZyYmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5OTM4OTIsImV4cCI6MjA4NDU2OTg5Mn0.RnNVs13Kw1XpfUyUbwdiUX44PXaSnIJICcTitDAZNL8'
      )

      const { data, error } = await supabase
        .from('colaboradores')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setFuncionarios(data)
      }
      setLoading(false)
    }
    fetchFuncionarios()
  }, [])

  const filteredFuncionarios = funcionarios.filter(func =>
    func.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    func.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este funcionário?')) {
      const supabase = createClient(
        'https://cyqiagacrmrsazhvrbgb.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5cWlhZ2Fjcm1yc2F6aHZyYmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5OTM4OTIsImV4cCI6MjA4NDU2OTg5Mn0.RnNVs13Kw1XpfUyUbwdiUX44PXaSnIJICcTitDAZNL8'
      )
      
      const { error } = await supabase
        .from('colaboradores')
        .delete()
        .eq('id', id)

      if (!error) {
        setFuncionarios(funcionarios.filter(f => f.id !== id))
        alert('Funcionário excluído com sucesso!')
      }
    }
  }

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .fade-in {
          animation: fadeIn 0.4s ease-out;
        }

        .table-row {
          transition: all 0.2s ease;
        }

        .table-row:hover {
          background-color: #f8fafc;
          transform: translateX(4px);
        }

        .action-button {
          padding: 0.5rem;
          border-radius: 0.5rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-button:hover {
          transform: translateY(-2px);
        }

        .edit-button {
          background-color: #dbeafe;
          color: #1e40af;
        }

        .edit-button:hover {
          background-color: #bfdbfe;
        }

        .delete-button {
          background-color: #fee2e2;
          color: #991b1b;
        }

        .delete-button:hover {
          background-color: #fecaca;
        }
      `}</style>

      <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
          padding: '2rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.5rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <button
                onClick={() => router.push('/dashboard-admin')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1.25rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
              >
                <ArrowLeft size={18} />
                Voltar 
              </button>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <div style={{
                  width: '3.5rem',
                  height: '3.5rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Users size={32} style={{ color: 'white' }} />
                </div>
                <div>
                  <h1 style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    color: 'white',
                    margin: 0,
                    letterSpacing: '0.02em'
                  }}>
                    Cadastro de Funcionários
                  </h1>
                  <p style={{
                    fontSize: '0.95rem',
                    color: 'rgba(255, 255, 255, 0.9)',
                    margin: '0.25rem 0 0 0'
                  }}>
                    Gerencie os colaboradores da sua empresa
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => router.push('/colaboradores/novo')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.875rem 1.75rem',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#059669'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#10b981'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              <Plus size={20} />
              Adicionar Novo Funcionário
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '2rem'
        }}>
          {/* Stats & Search */}
          <div className="fade-in" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {/* Total Card */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              border: '2px solid #8b5cf6'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  backgroundColor: '#ede9fe',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Users size={24} style={{ color: '#8b5cf6' }} />
                </div>
                <div>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    margin: '0 0 0.25rem 0',
                    fontWeight: '500'
                  }}>
                    Total de Funcionários
                  </p>
                  <p style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    color: '#1f2937',
                    margin: 0
                  }}>
                    {loading ? '...' : funcionarios.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Search Card */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              gridColumn: 'span 2'
            }}>
              <div style={{ position: 'relative' }}>
                <Search 
                  size={20} 
                  style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9ca3af'
                  }}
                />
                <input
                  type="text"
                  placeholder="Pesquisar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem 0.875rem 3rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.75rem',
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#8b5cf6'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="fade-in" style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '1rem',
            padding: '1.25rem',
            marginBottom: '2rem',
            display: 'flex',
            gap: '1rem',
            alignItems: 'flex-start'
          }}>
            <div style={{
              backgroundColor: '#3b82f6',
              borderRadius: '0.5rem',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Info size={20} style={{ color: 'white' }} />
            </div>
            <div>
              <h3 style={{
                fontSize: '0.95rem',
                fontWeight: '600',
                color: '#1e40af',
                margin: '0 0 0.375rem 0'
              }}>
                Informações sobre este módulo
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: '#1e40af',
                margin: 0,
                lineHeight: '1.6'
              }}>
                Nessa tela você cadastra os funcionários das suas empresas, dessa forma você consegue vincular eles nas perguntas. 
                Com o passar do tempo é possível ter um histórico de como está o desempenho da pessoa baseado nas respostas de perguntas relacionadas a ela.
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="fade-in" style={{
            backgroundColor: 'white',
            borderRadius: '1rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden'
          }}>
            {loading ? (
              <div style={{
                padding: '4rem 2rem',
                textAlign: 'center',
                color: '#6b7280'
              }}>
                Carregando...
              </div>
            ) : filteredFuncionarios.length === 0 ? (
              <div style={{
                padding: '4rem 2rem',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem'
                }}>
                  <Users size={40} style={{ color: '#9ca3af' }} />
                </div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#1f2937',
                  margin: '0 0 0.5rem 0'
                }}>
                  {searchTerm ? 'Nenhum funcionário encontrado' : 'Nenhum funcionário cadastrado'}
                </h3>
                <p style={{
                  fontSize: '0.95rem',
                  color: '#6b7280',
                  margin: '0 0 1.5rem 0'
                }}>
                  {searchTerm ? 'Tente buscar com outro termo' : 'Comece adicionando o primeiro funcionário da sua empresa'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => router.push('/colaboradores/novo')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#8b5cf6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7c3aed'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#8b5cf6'}
                  >
                    <Plus size={18} />
                    Adicionar Primeiro Funcionário
                  </button>
                )}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse'
                }}>
                  <thead>
                    <tr style={{
                      backgroundColor: '#f9fafb',
                      borderBottom: '2px solid #e5e7eb'
                    }}>
                      <th style={{
                        padding: '1rem',
                        textAlign: 'left',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        whiteSpace: 'nowrap'
                      }}>
                        Nome completo
                      </th>
                      <th style={{
                        padding: '1rem',
                        textAlign: 'left',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        whiteSpace: 'nowrap'
                      }}>
                        Email
                      </th>
                      <th style={{
                        padding: '1rem',
                        textAlign: 'left',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        whiteSpace: 'nowrap'
                      }}>
                        Celular
                      </th>
                      <th style={{
                        padding: '1rem',
                        textAlign: 'left',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        whiteSpace: 'nowrap'
                      }}>
                        Cargo
                      </th>
                      <th style={{
                        padding: '1rem',
                        textAlign: 'center',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        whiteSpace: 'nowrap'
                      }}>
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFuncionarios.map((func) => (
                      <tr 
                        key={func.id}
                        className="table-row"
                        style={{
                          borderBottom: '1px solid #f3f4f6'
                        }}
                      >
                        <td style={{
                          padding: '1rem',
                          fontSize: '0.95rem',
                          color: '#1f2937',
                          fontWeight: '500'
                        }}>
                          {func.nome}
                        </td>
                        <td style={{
                          padding: '1rem',
                          fontSize: '0.875rem',
                          color: '#6b7280'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}>
                            <Mail size={16} style={{ color: '#9ca3af' }} />
                            {func.email}
                          </div>
                        </td>
                        <td style={{
                          padding: '1rem',
                          fontSize: '0.875rem',
                          color: '#6b7280'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}>
                            <Phone size={16} style={{ color: '#9ca3af' }} />
                            {func.celular}
                          </div>
                        </td>
                        <td style={{
                          padding: '1rem',
                          fontSize: '0.875rem',
                          color: '#6b7280',
                          textTransform: 'capitalize'
                        }}>
                          {func.cargo}
                        </td>
                        <td style={{
                          padding: '1rem'
                        }}>
                          <div style={{
                            display: 'flex',
                            gap: '0.5rem',
                            justifyContent: 'center'
                          }}>
                            <button
                              className="action-button edit-button"
                              onClick={() => router.push(`/colaboradores/editar/${func.id}`)}
                              title="Editar funcionário"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              className="action-button delete-button"
                              onClick={() => handleDelete(func.id)}
                              title="Excluir funcionário"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}