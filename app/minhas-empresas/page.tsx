'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  MapPin,
  FileText,
  Info,
  ArrowLeft,
  CheckCircle,
  X
} from 'lucide-react'

export default function MinhasEmpresas() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    tipo: '',
    ativa: false,
    auditor: false,
    endereco: '',
    estado: '',
    cidade: ''
  })

  // AQUI VOCÊ VAI BUSCAR AS EMPRESAS DO SUPABASE
  const empresas: any[] = []

  const estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ]

  const handleSubmit = async () => {
    if (!formData.nome || !formData.cnpj || !formData.tipo) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    console.log('Criar empresa:', formData)
    setShowAddModal(false)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      nome: '',
      cnpj: '',
      tipo: '',
      ativa: false,
      auditor: false,
      endereco: '',
      estado: '',
      cidade: ''
    })
  }

  const filteredEmpresas = empresas.filter(emp =>
    emp.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.cnpj?.includes(searchTerm)
  )

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .fade-in { animation: fadeIn 0.4s ease-out; }
        .slide-in { animation: slideIn 0.3s ease-out; }

        .table-row {
          transition: all 0.2s ease;
        }

        .table-row:hover {
          background-color: #f8fafc;
          transform: translateX(4px);
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .modal-content {
          background-color: white;
          border-radius: 1rem;
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .form-input {
          width: 100%;
          padding: 0.875rem 1rem;
          border: 2px solid #e5e7eb;
          border-radius: 0.75rem;
          font-size: 0.95rem;
          outline: none;
          transition: all 0.2s ease;
        }

        .form-input:focus {
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }

        .form-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .checkbox-container {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem 1rem;
          background-color: #f9fafb;
          border: 2px solid #e5e7eb;
          border-radius: 0.75rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .checkbox-container:hover {
          background-color: #f3f4f6;
          border-color: #d1d5db;
        }

        .checkbox-container input[type="checkbox"] {
          width: 20px;
          height: 20px;
          cursor: pointer;
          accent-color: #8b5cf6;
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
                  <Building2 size={32} style={{ color: 'white' }} />
                </div>
                <div>
                  <h1 style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    color: 'white',
                    margin: 0,
                    letterSpacing: '0.02em'
                  }}>
                    Minhas Empresas
                  </h1>
                  <p style={{
                    fontSize: '0.95rem',
                    color: 'rgba(255, 255, 255, 0.9)',
                    margin: '0.25rem 0 0 0'
                  }}>
                    Gerencie as empresas do seu grupo
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
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
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#10b981'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <Plus size={20} />
              Nova Empresa
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
                  <Building2 size={24} style={{ color: '#8b5cf6' }} />
                </div>
                <div>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    margin: '0 0 0.25rem 0',
                    fontWeight: '500'
                  }}>
                    Total de Empresas
                  </p>
                  <p style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    color: '#1f2937',
                    margin: 0
                  }}>
                    {empresas.length}
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
                  placeholder="Pesquisar por nome ou CNPJ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input"
                  style={{
                    paddingLeft: '3rem'
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
                Sobre o cadastro de empresas
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: '#1e40af',
                margin: 0,
                lineHeight: '1.6'
              }}>
                Cadastre as empresas do seu grupo para poder atribuir checklists e acompanhar o desempenho de cada unidade.
              </p>
            </div>
          </div>

          {/* Table/Empty State */}
          <div className="fade-in" style={{
            backgroundColor: 'white',
            borderRadius: '1rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden'
          }}>
            {empresas.length === 0 ? (
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
                  <Building2 size={40} style={{ color: '#9ca3af' }} />
                </div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#1f2937',
                  margin: '0 0 0.5rem 0'
                }}>
                  Nenhuma empresa cadastrada
                </h3>
                <p style={{
                  fontSize: '0.95rem',
                  color: '#6b7280',
                  margin: '0 0 1.5rem 0'
                }}>
                  Comece adicionando a primeira empresa do seu grupo
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
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
                  Adicionar Primeira Empresa
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Modal aqui (mesmo código de antes) */}
    </>
  )
}