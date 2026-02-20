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
      console.error('Erro ao cadastrar:', error)
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
        .form-input {
          width: 100%;
          padding: 0.875rem 1rem 0.875rem 3rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.2s ease;
          box-sizing: border-box;
        }
        .form-input:focus {
          border-color: #2196F3;
          box-shadow: 0 0 0 3px rgba(33,150,243,0.1);
        }
      `}</style>

      <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>

          {/* Voltar */}
          <button
            onClick={() => router.push('/colaboradores')}
            type="button"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              color: '#374151',
              fontSize: '0.95rem',
              marginBottom: '2rem'
            }}
          >
            <ArrowLeft size={18} />
            Voltar
          </button>

          {/* Main card */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                <Users size={28} style={{ color: '#2196F3' }} />
                <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                  Novo Colaborador
                </h1>
              </div>
              <p style={{ color: '#6b7280', margin: 0, fontSize: '0.95rem' }}>
                Preencha os dados do colaborador
              </p>
            </div>

            {credenciais ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
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
                  textAlign: 'left',
                  maxWidth: '400px',
                  margin: '0 auto 2rem'
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
                      backgroundColor: copiado ? '#22c55e' : '#2196F3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
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
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
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
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <Building2 size={48} style={{ color: '#9ca3af', margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  Nenhuma empresa cadastrada
                </h3>
                <p style={{ color: '#6b7280' }}>
                  Você precisa cadastrar pelo menos uma empresa antes de adicionar colaboradores.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '1.5rem',
                  marginBottom: '2rem'
                }}>
                  {/* Empresa */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>Empresa/Loja *</label>
                    <div style={{ position: 'relative' }}>
                      <Building2 size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                      <select
                        required
                        className="form-input"
                        value={formData.empresa_id}
                        onChange={(e) => setFormData({ ...formData, empresa_id: e.target.value })}
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
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>Nome Completo *</label>
                    <div style={{ position: 'relative' }}>
                      <User size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                      <input
                        type="text"
                        required
                        className="form-input"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        placeholder="Digite o nome completo"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>Email (login) *</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                      <input
                        type="email"
                        required
                        className="form-input"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@exemplo.com"
                      />
                    </div>
                  </div>

                  {/* Celular */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>Celular</label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                      <input
                        type="tel"
                        className="form-input"
                        value={formData.celular}
                        onChange={(e) => setFormData({ ...formData, celular: formatPhone(e.target.value) })}
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                      />
                    </div>
                  </div>

                  {/* Cargo */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>Cargo *</label>
                    <div style={{ position: 'relative' }}>
                      <Briefcase size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                      <select
                        required
                        className="form-input"
                        value={formData.cargo}
                        onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
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
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>Senha *</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                      <input
                        type="password"
                        required
                        className="form-input"
                        value={formData.senha}
                        onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                        placeholder="Mínimo 6 caracteres"
                        minLength={6}
                      />
                    </div>
                  </div>

                  {/* Confirmar Senha */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>Confirmar Senha *</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                      <input
                        type="password"
                        required
                        className="form-input"
                        value={formData.confirmarSenha}
                        onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })}
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
                      border: '1px solid #e5e7eb',
                      backgroundColor: 'white',
                      color: '#374151',
                      borderRadius: '0.5rem',
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
                      borderRadius: '0.5rem',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '0.95rem',
                      fontWeight: '600'
                    }}
                  >
                    <Save size={18} />
                    {loading ? 'Cadastrando...' : 'Cadastrar Colaborador'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
