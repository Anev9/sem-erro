'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react'

export default function AlterarSenha() {
  const router = useRouter()
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [showSenhaAtual, setShowSenhaAtual] = useState(false)
  const [showNovaSenha, setShowNovaSenha] = useState(false)
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const validarSenha = () => {
    if (!senhaAtual) {
      setMessage({ type: 'error', text: 'Digite sua senha atual' })
      return false
    }
    if (novaSenha.length < 6) {
      setMessage({ type: 'error', text: 'A nova senha deve ter no mínimo 6 caracteres' })
      return false
    }
    if (novaSenha !== confirmarSenha) {
      setMessage({ type: 'error', text: 'As senhas não coincidem' })
      return false
    }
    if (senhaAtual === novaSenha) {
      setMessage({ type: 'error', text: 'A nova senha deve ser diferente da senha atual' })
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!validarSenha()) return

    setLoading(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      setMessage({ type: 'success', text: 'Senha alterada com sucesso!' })
      setSenhaAtual('')
      setNovaSenha('')
      setConfirmarSenha('')
      
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Erro ao alterar senha. Tente novamente.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .floating { animation: float 3s ease-in-out infinite; }
        .fade-in { animation: fadeIn 0.6s ease-out; }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background decorations */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          width: '300px',
          height: '300px',
          background: 'rgba(249, 115, 22, 0.15)',
          borderRadius: '50%',
          filter: 'blur(80px)',
          pointerEvents: 'none'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '10%',
          right: '5%',
          width: '400px',
          height: '400px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          filter: 'blur(80px)',
          pointerEvents: 'none'
        }}></div>

        <div className="fade-in" style={{ 
          width: '100%', 
          maxWidth: '480px',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '1.5rem',
            padding: '3rem 2.5rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)'
          }}>
            {/* Logo */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div className="floating" style={{
                width: '5rem',
                height: '5rem',
                margin: '0 auto 1.5rem auto',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                borderRadius: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)'
              }}>
                <Lock style={{ width: '2.5rem', height: '2.5rem', color: 'white' }} />
              </div>
              
              <h1 style={{ 
                fontSize: '2rem', 
                fontWeight: 'bold', 
                color: '#1f2937', 
                marginBottom: '0.5rem',
                letterSpacing: '-0.02em'
              }}>
                Alterar Senha
              </h1>
              <p style={{ color: '#6b7280', fontSize: '1rem' }}>
                Defina uma nova senha para sua conta
              </p>
            </div>

            {/* Mensagem de feedback */}
            {message && (
              <div style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                backgroundColor: message.type === 'success' ? '#d1fae5' : '#fee2e2',
                color: message.type === 'success' ? '#065f46' : '#991b1b',
                border: `1px solid ${message.type === 'success' ? '#6ee7b7' : '#fca5a5'}`
              }}>
                {message.type === 'success' && (
                  <CheckCircle style={{ width: '1.25rem', height: '1.25rem', marginTop: '0.125rem', flexShrink: 0 }} />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Senha Atual */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: '500', 
                  color: '#374151', 
                  marginBottom: '0.5rem' 
                }}>
                  Senha Atual
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '1.25rem',
                    height: '1.25rem',
                    color: '#9ca3af',
                    pointerEvents: 'none'
                  }} />
                  <input
                    type={showSenhaAtual ? 'text' : 'password'}
                    value={senhaAtual}
                    onChange={(e) => setSenhaAtual(e.target.value)}
                    placeholder="Digite sua senha atual"
                    required
                    style={{
                      width: '100%',
                      padding: '0.875rem 3rem 0.875rem 3rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.75rem',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#f97316'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249, 115, 22, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenhaAtual(!showSenhaAtual)}
                    style={{
                      position: 'absolute',
                      right: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#9ca3af',
                      padding: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'color 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#f97316'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                  >
                    {showSenhaAtual ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Nova Senha */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: '500', 
                  color: '#374151', 
                  marginBottom: '0.5rem' 
                }}>
                  Nova Senha
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '1.25rem',
                    height: '1.25rem',
                    color: '#9ca3af',
                    pointerEvents: 'none'
                  }} />
                  <input
                    type={showNovaSenha ? 'text' : 'password'}
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="Digite sua nova senha"
                    required
                    style={{
                      width: '100%',
                      padding: '0.875rem 3rem 0.875rem 3rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.75rem',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#f97316'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249, 115, 22, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNovaSenha(!showNovaSenha)}
                    style={{
                      position: 'absolute',
                      right: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#9ca3af',
                      padding: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'color 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#f97316'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                  >
                    {showNovaSenha ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Confirmar Nova Senha */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: '500', 
                  color: '#374151', 
                  marginBottom: '0.5rem' 
                }}>
                  Confirmar Nova Senha
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '1.25rem',
                    height: '1.25rem',
                    color: '#9ca3af',
                    pointerEvents: 'none'
                  }} />
                  <input
                    type={showConfirmarSenha ? 'text' : 'password'}
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="Confirme sua nova senha"
                    required
                    style={{
                      width: '100%',
                      padding: '0.875rem 3rem 0.875rem 3rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.75rem',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#f97316'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249, 115, 22, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmarSenha(!showConfirmarSenha)}
                    style={{
                      position: 'absolute',
                      right: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#9ca3af',
                      padding: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'color 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#f97316'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                  >
                    {showConfirmarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Requisitos da senha */}
              <div style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '0.75rem',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                <p style={{ 
                  fontSize: '0.875rem', 
                  color: '#1e3a8a', 
                  fontWeight: '500', 
                  marginBottom: '0.5rem' 
                }}>
                  Requisitos da senha:
                </p>
                <ul style={{ 
                  fontSize: '0.875rem', 
                  color: '#1e40af',
                  margin: 0,
                  paddingLeft: '1rem'
                }}>
                  <li style={{ 
                    marginBottom: '0.25rem',
                    color: novaSenha.length >= 6 ? '#16a34a' : '#1e40af',
                    fontWeight: novaSenha.length >= 6 ? '500' : 'normal'
                  }}>
                    Mínimo de 6 caracteres
                  </li>
                  <li style={{ 
                    marginBottom: '0.25rem',
                    color: novaSenha === confirmarSenha && novaSenha ? '#16a34a' : '#1e40af',
                    fontWeight: novaSenha === confirmarSenha && novaSenha ? '500' : 'normal'
                  }}>
                    Senhas devem coincidir
                  </li>
                  <li style={{ 
                    color: senhaAtual && novaSenha && senhaAtual !== novaSenha ? '#16a34a' : '#1e40af',
                    fontWeight: senhaAtual && novaSenha && senhaAtual !== novaSenha ? '500' : 'normal'
                  }}>
                    Diferente da senha atual
                  </li>
                </ul>
              </div>

              {/* Botão Alterar */}
              <button 
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  background: 'linear-gradient(to right, #f97316, #ea580c)',
                  color: 'white',
                  padding: '1rem',
                  border: 'none',
                  borderRadius: '0.75rem',
                  fontSize: '1.125rem',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1,
                  boxShadow: '0 4px 6px rgba(249, 115, 22, 0.3)',
                  transition: 'all 0.3s ease',
                  marginBottom: '1rem'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 10px 15px rgba(249, 115, 22, 0.4)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(249, 115, 22, 0.3)'
                }}
              >
                {loading ? 'Alterando...' : 'Alterar Senha'}
              </button>

              {/* Botão Voltar */}
              <button 
                type="button"
                onClick={() => router.push('/login')}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  backgroundColor: 'transparent',
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.75rem',
                  cursor: 'pointer',
                  color: '#6b7280',
                  fontSize: '1rem',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#f97316'
                  e.currentTarget.style.color = '#f97316'
                  e.currentTarget.style.backgroundColor = '#fff7ed'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb'
                  e.currentTarget.style.color = '#6b7280'
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <ArrowLeft size={16} />
                Voltar
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}