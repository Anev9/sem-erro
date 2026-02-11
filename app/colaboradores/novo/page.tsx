'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import {
  ArrowLeft,
  Users,
  Save,
  User,
  Mail,
  Phone,
  Lock,
  Briefcase
} from 'lucide-react'

export default function NovoColaborador() {
  const router = useRouter()
  
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    celular: '',
    cargo: '',
    senha: '',
    confirmarSenha: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.senha !== formData.confirmarSenha) {
      alert('As senhas não coincidem!')
      return
    }

    if (formData.senha.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres!')
      return
    }

    setLoading(true)

    try {
      // Criar cliente Supabase
      const supabase = createClient(
        'https://cyqiagacrmrsazhvrbgb.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5cWlhZ2Fjcm1yc2F6aHZyYmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5OTM4OTIsImV4cCI6MjA4NDU2OTg5Mn0.RnNVs13Kw1XpfUyUbwdiUX44PXaSnIJICcTitDAZNL8'
      )

      // 1. Criar usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.senha
      })

      if (authError) {
        alert('Erro ao criar usuário: ' + authError.message)
        setLoading(false)
        return
      }

      // 2. Salvar na tabela colaboradores
      const { error: dbError } = await supabase
        .from('colaboradores')
        .insert({
          user_id: authData.user?.id,
          nome: formData.nome,
          email: formData.email,
          celular: formData.celular,
          cargo: formData.cargo,
          ativo: true
        })

      if (dbError) {
        alert('Erro ao salvar dados: ' + dbError.message)
        setLoading(false)
        return
      }

      alert('✅ Colaborador cadastrado com sucesso!')
      router.push('/colaboradores')

    } catch (error: any) {
      alert('Erro: ' + error.message)
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
      `}</style>

      <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
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
                  Adicionar Novo Colaborador
                </h1>
                <p style={{
                  fontSize: '0.95rem',
                  color: 'rgba(255, 255, 255, 0.9)',
                  margin: '0.25rem 0 0 0'
                }}>
                  Preencha os dados do novo colaborador
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
                  <label className="form-label">Celular *</label>
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
                      required
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
                      <option value="gerente">Gerente</option>
                      <option value="supervisor">Supervisor</option>
                      <option value="operador">Operador</option>
                      <option value="assistente">Assistente</option>
                      <option value="conferente">Conferente</option>
                      <option value="repositor">Repositor</option>
                      <option value="caixa">Caixa</option>
                      <option value="açougueiro">Açougueiro</option>
                      <option value="padeiro">Padeiro</option>
                    </select>
                  </div>
                </div>

                {/* Senha */}
                <div>
                  <label className="form-label">Senha *</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={20} style={{
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#9ca3af'
                    }}/>
                    <input
                      type="password"
                      required
                      className="form-input"
                      value={formData.senha}
                      onChange={(e) => setFormData({...formData, senha: e.target.value})}
                      placeholder="Mínimo 6 caracteres"
                      minLength={6}
                    />
                  </div>
                </div>

                {/* Confirmar Senha */}
                <div>
                  <label className="form-label">Confirmar Senha *</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={20} style={{
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#9ca3af'
                    }}/>
                    <input
                      type="password"
                      required
                      className="form-input"
                      value={formData.confirmarSenha}
                      onChange={(e) => setFormData({...formData, confirmarSenha: e.target.value})}
                      placeholder="Digite a senha novamente"
                    />
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
                    fontWeight: '600',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
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
                    backgroundColor: loading ? '#9ca3af' : '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.75rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#7c3aed')}
                  onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#8b5cf6')}
                >
                  <Save size={18} />
                  {loading ? 'Cadastrando...' : 'Cadastrar Colaborador'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}