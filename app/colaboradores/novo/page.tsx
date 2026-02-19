'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Users,
  Save,
  User,
  Mail,
  Phone,
  Lock,
  Briefcase,
  Building2,
  CheckCircle,
  Copy,
  Check
} from 'lucide-react'

interface Empresa {
  id: string
  nome_fantasia: string
}

export default function NovoColaborador() {
  const router = useRouter()
  
  const [loading, setLoading] = useState(false)
  const [loadingEmpresas, setLoadingEmpresas] = useState(true)
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [alunoId, setAlunoId] = useState<string>('')
  const [credenciais, setCredenciais] = useState<{ email: string; senha: string } | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    celular: '',
    cargo: '',
    empresa_id: '',
    senha: '',
    confirmarSenha: ''
  })

  useEffect(() => {
    verificarAutenticacao()
  }, [])

  async function verificarAutenticacao() {
    try {
      // Verificar se o usuário está logado como ALUNO
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        alert('Você precisa estar logado como cliente')
        router.push('/login')
        return
      }

      const user = JSON.parse(userStr)
      
      if (user.role !== 'aluno') {
        alert('Apenas clientes podem cadastrar colaboradores')
        router.push('/login')
        return
      }

      setAlunoId(user.id)
      await carregarEmpresas(user.id)
      
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error)
      alert('Erro ao verificar autenticação')
    }
  }

  async function carregarEmpresas(alunoId: string) {
    try {
      setLoadingEmpresas(true)
      const res = await fetch(`/api/aluno/empresas?aluno_id=${alunoId}`)
      const data = res.ok ? await res.json() : []
      const ativas = data.filter((e: any) => e.ativo !== false)
      setEmpresas(ativas)
      if (ativas.length === 1) setFormData(prev => ({ ...prev, empresa_id: ativas[0].id }))
    } catch (error) {
      console.error('Erro ao carregar empresas:', error)
    } finally {
      setLoadingEmpresas(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!formData.empresa_id) {
      alert('Por favor, selecione uma empresa/loja!')
      return
    }

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
      const res = await fetch('/api/aluno/colaboradores/criar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          senha: formData.senha,
          nome: formData.nome,
          celular: formData.celular || null,
          cargo: formData.cargo,
          empresa_id: formData.empresa_id
        })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao cadastrar colaborador')
      }
      setCredenciais({ email: formData.email, senha: formData.senha })
    } catch (error: any) {
      console.error('💥 Erro ao cadastrar:', error)
      alert(error.message || 'Erro ao cadastrar colaborador')
    } finally {
      setLoading(false)
    }
  }

  async function copiarCredenciais() {
    if (!credenciais) return
    const texto = `Email: ${credenciais.email}\nSenha: ${credenciais.senha}`
    await navigator.clipboard.writeText(texto)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
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
          border-color: #f97316;
          box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
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
          background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
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
              type="button"
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
          {credenciais ? (
          <div className="fade-in" style={{
            backgroundColor: 'white',
            borderRadius: '1rem',
            padding: '3rem',
            textAlign: 'center',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
          }}>
            <CheckCircle size={56} style={{ color: '#22c55e', margin: '0 auto 1.5rem' }} />
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem' }}>
              Colaborador cadastrado com sucesso!
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
              Anote e envie os dados de acesso para o colaborador.
            </p>

            <div style={{
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              marginBottom: '2rem',
              textAlign: 'left'
            }}>
              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</span>
                <p style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', margin: '0.25rem 0 0 0' }}>{credenciais.email}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Senha</span>
                <p style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', margin: '0.25rem 0 0 0' }}>{credenciais.senha}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={copiarCredenciais}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: copiado ? '#22c55e' : '#f97316',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.75rem',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  transition: 'background-color 0.2s'
                }}
              >
                {copiado ? <Check size={18} /> : <Copy size={18} />}
                {copiado ? 'Copiado!' : 'Copiar dados'}
              </button>
              <button
                onClick={() => router.push('/colaboradores')}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'white',
                  color: '#374151',
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.75rem',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600'
                }}
              >
                Ir para colaboradores
              </button>
            </div>
          </div>
        ) : loadingEmpresas ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: '#6b7280' }}>Carregando empresas...</p>
            </div>
          ) : empresas.length === 0 ? (
            <div className="fade-in" style={{
              backgroundColor: 'white',
              borderRadius: '1rem',
              padding: '3rem',
              textAlign: 'center',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
            }}>
              <Building2 size={48} style={{ color: '#9ca3af', margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                Nenhuma empresa cadastrada
              </h3>
              <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                Você precisa cadastrar pelo menos uma empresa antes de adicionar colaboradores.
              </p>
            </div>
          ) : (
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
                  {/* Empresa */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Empresa/Loja *</label>
                    <div style={{ position: 'relative' }}>
                      <Building2 size={20} style={{
                        position: 'absolute',
                        left: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#9ca3af'
                      }}/>
                      <select
                        required
                        className="form-input"
                        value={formData.empresa_id}
                        onChange={(e) => setFormData({...formData, empresa_id: e.target.value})}
                        disabled={empresas.length === 1}
                      >
                        <option value="">Selecione a empresa/loja</option>
                        {empresas.map((empresa) => (
                          <option key={empresa.id} value={empresa.id}>
                            {empresa.nome_fantasia}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

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
                    <label className="form-label">Email (login) *</label>
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
                      backgroundColor: loading ? '#9ca3af' : '#f97316',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.75rem',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '0.95rem',
                      fontWeight: '600'
                    }}
                  >
                    <Save size={18} />
                    {loading ? 'Cadastrando...' : 'Cadastrar Colaborador'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  )
}