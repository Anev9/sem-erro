'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft,
  Calendar,
  Building2,
  Search,
  FileCheck,
  Download,
  Eye,
  Filter
} from 'lucide-react'

export default function ChecklistsCriados() {
  const router = useRouter()
  const [loja, setLoja] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  const checklistsCriados: Array<{
    id: number
    titulo: string
    empresa: string
    dataCriacao: string
    status: 'concluido' | 'pendente' | 'em_andamento'
    responsavel: string
  }> = []

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Buscar:', { loja, dataInicio, dataFim })
    // Aqui virá a integração com o banco
  }

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .slide-up { animation: slideUp 0.5s ease-out; }
        .hover-lift { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .hover-lift:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12) !important; }
      `}</style>

      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative'
      }}>
        {/* Background Pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'radial-gradient(circle at 20px 20px, rgba(255, 255, 255, 0.05) 2px, transparent 0)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none'
        }} />

        {/* Header */}
        <div style={{
          position: 'relative',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '2rem 1.5rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem'
            }}>
              <button
                onClick={() => router.push('/dashboard-admin')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateX(-4px)'
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateX(0)'
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)'
                }}
              >
                <ArrowLeft size={18} />
                Voltar
              </button>
              <div>
                <h1 style={{
                  fontSize: '2.25rem',
                  fontWeight: '800',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: 0,
                  letterSpacing: '-0.02em'
                }}>
                  Lista de Checklists que já foram Criados
                </h1>
                <p style={{
                  fontSize: '1rem',
                  color: '#64748b',
                  margin: '0.5rem 0 0 0',
                  fontWeight: '500'
                }}>
                  Visualize e gerencie todos os checklists já cadastrados
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '3rem 1.5rem',
          position: 'relative'
        }}>
          {/* Filtros */}
          <div className="slide-up" style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '2.5rem',
            marginBottom: '2.5rem',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            <form onSubmit={handleBuscar}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
              }}>
                {/* Loja */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    color: '#1e293b',
                    marginBottom: '0.75rem'
                  }}>
                    Loja
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Building2 style={{
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94a3b8',
                      width: '20px',
                      height: '20px',
                      pointerEvents: 'none'
                    }} />
                    <select
                      value={loja}
                      onChange={(e) => setLoja(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '1rem 1rem 1rem 3rem',
                        border: '2px solid #e2e8f0',
                        borderRadius: '12px',
                        fontSize: '1rem',
                        outline: 'none',
                        transition: 'all 0.3s ease',
                        backgroundColor: 'white',
                        cursor: 'pointer'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#667eea'
                        e.currentTarget.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#e2e8f0'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <option value="">Selecione a empresa</option>
                      <option value="empresa1">Empresa 1</option>
                      <option value="empresa2">Empresa 2</option>
                      <option value="empresa3">Empresa 3</option>
                    </select>
                  </div>
                </div>

                {/* A partir de */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    color: '#1e293b',
                    marginBottom: '0.75rem'
                  }}>
                    A partir de
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Calendar style={{
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94a3b8',
                      width: '20px',
                      height: '20px',
                      pointerEvents: 'none'
                    }} />
                    <input
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '1rem 1rem 1rem 3rem',
                        border: '2px solid #e2e8f0',
                        borderRadius: '12px',
                        fontSize: '1rem',
                        outline: 'none',
                        transition: 'all 0.3s ease',
                        backgroundColor: 'white'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#667eea'
                        e.currentTarget.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#e2e8f0'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Até */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    color: '#1e293b',
                    marginBottom: '0.75rem'
                  }}>
                    Até
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Calendar style={{
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94a3b8',
                      width: '20px',
                      height: '20px',
                      pointerEvents: 'none'
                    }} />
                    <input
                      type="date"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '1rem 1rem 1rem 3rem',
                        border: '2px solid #e2e8f0',
                        borderRadius: '12px',
                        fontSize: '1rem',
                        outline: 'none',
                        transition: 'all 0.3s ease',
                        backgroundColor: 'white'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#667eea'
                        e.currentTarget.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#e2e8f0'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Botão Enviar */}
              <button
                type="submit"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1rem 2.5rem',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '1.05rem',
                  fontWeight: '700',
                  boxShadow: '0 8px 20px rgba(59, 130, 246, 0.4)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)'
                  e.currentTarget.style.boxShadow = '0 12px 28px rgba(59, 130, 246, 0.5)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.4)'
                }}
              >
                <Search size={20} />
                Buscar
              </button>
            </form>

            {/* Texto informativo */}
            <p style={{
              fontSize: '0.9rem',
              color: '#64748b',
              fontStyle: 'italic',
              margin: '2rem 0 0 0',
              lineHeight: '1.7'
            }}>
              Nessa tela aparecem os checklists que foram agendados pela rotina automática baseados num 
              modelo que você fez, ou naqueles que você criou manualmente.
            </p>
          </div>

          {/* Resultados */}
          <div className="slide-up">
            {checklistsCriados.length === 0 ? (
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '24px',
                padding: '6rem 2rem',
                textAlign: 'center',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <div style={{
                  width: '120px',
                  height: '120px',
                  margin: '0 auto 2.5rem auto',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 20px 50px rgba(102, 126, 234, 0.3)',
                  transform: 'rotate(-5deg)'
                }}>
                  <FileCheck size={60} style={{ color: 'white' }} strokeWidth={2.5} />
                </div>
                <h2 style={{
                  fontSize: '2rem',
                  fontWeight: '800',
                  color: '#1e293b',
                  margin: '0 0 1rem 0',
                  letterSpacing: '-0.02em'
                }}>
                  Nenhum checklist encontrado
                </h2>
                <p style={{
                  fontSize: '1.125rem',
                  color: '#64748b',
                  margin: 0,
                  lineHeight: '1.7'
                }}>
                  Use os filtros acima para buscar checklists criados ou aguarde a criação automática
                </p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gap: '1.5rem'
              }}>
                {checklistsCriados.map((checklist) => (
                  <div 
                    key={checklist.id}
                    className="hover-lift"
                    style={{
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: '16px',
                      padding: '2rem',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <div>
                      <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        color: '#1e293b',
                        margin: '0 0 0.5rem 0'
                      }}>
                        {checklist.titulo}
                      </h3>
                      <p style={{
                        fontSize: '0.95rem',
                        color: '#64748b',
                        margin: 0
                      }}>
                        {checklist.empresa} • {checklist.dataCriacao}
                      </p>
                    </div>
                    <button
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Eye size={18} />
                      Ver Detalhes
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  )
}