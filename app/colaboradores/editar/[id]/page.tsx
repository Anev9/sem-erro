'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  Users,
  Save,
  User,
  Mail,
  Phone,
  Briefcase
} from 'lucide-react'

export default function EditarColaborador() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    celular: '',
    cargo: ''
  })

  useEffect(() => {
    verificarAutenticacao()
  }, [id])

  function verificarAutenticacao() {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      router.push('/login')
      return
    }
    const user = JSON.parse(userStr)
    if (user.role !== 'aluno') {
      router.push('/login')
      return
    }
    fetchColaborador()
  }

  async function fetchColaborador() {
    try {
      const userStr = localStorage.getItem('user')
      if (!userStr) { router.push('/login'); return }
      const user = JSON.parse(userStr)

      const res = await fetch(`/api/aluno/colaboradores?aluno_id=${user.id}`)
      if (!res.ok) throw new Error('Erro ao carregar')
      const lista = await res.json()
      const data = lista.find((c: any) => c.id === id)

      if (!data) {
        alert('Colaborador não encontrado ou acesso negado.')
        router.push('/colaboradores')
        return
      }

      setFormData({
        nome: data.nome,
        email: data.email,
        celular: data.celular || '',
        cargo: data.cargo
      })
    } catch (error) {
      console.error('Erro ao carregar colaborador:', error)
      alert('Erro ao carregar dados do colaborador')
    } finally {
      setLoadingData(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/aluno/colaboradores', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          nome: formData.nome,
          email: formData.email,
          celular: formData.celular || null,
          cargo: formData.cargo
        })
      })
      if (!res.ok) throw new Error('Erro ao atualizar')

      alert('✅ Colaborador atualizado com sucesso!')
      router.push('/colaboradores')

    } catch (error: any) {
      console.error('Erro ao atualizar:', error)
      alert('Erro: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
    }
    return value
  }

  if (loadingData) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: '1.2rem', color: '#6b7280' }}>Carregando...</p>
      </div>
    )
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

        .form-input {
          width: 100%;
          padding: 0.875rem 1rem 0.875rem 3rem;
          border: 2px solid #e5e7eb;
          border-radius: 0.75rem;
          font-size: 0.95rem;
          outline: none;
          transition: all 0.2s ease;
        }

        .form-input:focus {
          border-color: #2196F3;
          box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
        }

        .form-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }
      `}</style>

      <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
          padding: '2rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <button
              onClick={() => router.push('/colaboradores')}
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
                fontWeight: '500'
              }}
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
                  margin: 0
                }}>
                  Editar Colaborador
                </h1>
                <p style={{
                  fontSize: '0.95rem',
                  color: 'rgba(255, 255, 255, 0.9)',
                  margin: '0.25rem 0 0 0'
                }}>
                  Atualize os dados do colaborador
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '2rem'
        }}>
          <form onSubmit={handleSubmit} className="fade-in">
            <div style={{
              backgroundColor: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
              }}>
                {/* Nome */}
                <div>
                  <label className="form-label">Nome Completo *</label>
                  <div style={{ position: 'relative' }}>
                    <User size={20} style={{
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#9ca3af'
                    }}/>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      placeholder="Digite o nome completo"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="form-label">Email *</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={20} style={{
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#9ca3af'
                    }}/>
                    <input
                      type="email"
                      required
                      className="form-input"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                </div>

                {/* Celular */}
                <div>
                  <label className="form-label">Celular</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={20} style={{
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#9ca3af'
                    }}/>
                    <input
                      type="tel"
                      className="form-input"
                      value={formData.celular}
                      onChange={(e) => setFormData({...formData, celular: formatPhone(e.target.value)})}
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                    />
                  </div>
                </div>

                {/* Cargo */}
                <div>
                  <label className="form-label">Cargo *</label>
                  <div style={{ position: 'relative' }}>
                    <Briefcase size={20} style={{
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#9ca3af'
                    }}/>
                    <select
                      required
                      className="form-input"
                      value={formData.cargo}
                      onChange={(e) => setFormData({...formData, cargo: e.target.value})}
                    >
                      <option value="">Selecione um cargo</option>
                      <option value="Gerente">Gerente</option>
                      <option value="Supervisor">Supervisor</option>
                      <option value="Operador">Operador</option>
                      <option value="Assistente">Assistente</option>
                      <option value="Conferente">Conferente</option>
                      <option value="Repositor">Repositor</option>
                      <option value="Caixa">Caixa</option>
                      <option value="Açougueiro">Açougueiro</option>
                      <option value="Padeiro">Padeiro</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end',
                paddingTop: '1.5rem',
                borderTop: '1px solid #e5e7eb'
              }}>
                <button
                  type="button"
                  onClick={() => router.push('/colaboradores')}
                  style={{
                    padding: '0.875rem 2rem',
                    border: '2px solid #e5e7eb',
                    backgroundColor: 'white',
                    color: '#374151',
                    borderRadius: '0.75rem',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: '600'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.875rem 2rem',
                    background: loading ? '#9ca3af' : 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.75rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: '600'
                  }}
                >
                  <Save size={18} />
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}