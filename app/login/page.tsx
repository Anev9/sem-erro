"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors = { email: '', password: '' };
    
    if (!email) {
      newErrors.email = 'Por favor, insira seu e-mail';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Por favor, insira um e-mail válido';
    }
    
    if (!password) {
      newErrors.password = 'Por favor, insira sua senha';
    }
    
    setErrors(newErrors);
    
    if (!newErrors.email && !newErrors.password) {
      setLoading(true);
      
      try {
        const { data: aluno, error } = await supabase
          .from('alunos')
          .select('*')
          .eq('e-mail', email)
          .eq('senha', password)
          .single();

        if (error || !aluno) {
          throw new Error('E-mail ou senha incorretos');
        }

        // SALVAR DADOS DO ALUNO NO LOCALSTORAGE
        localStorage.setItem('aluno', JSON.stringify(aluno));
        
        // REDIRECIONAR BASEADO NO TIPO
        if (aluno.tipo === 'admin') {
          router.push('/dashboard-admin');
        } else {
          router.push('/dashboard-aluno');
        }
        
      } catch (error: any) {
        setErrors({ ...newErrors, password: error.message || 'E-mail ou senha incorretos' });
        setLoading(false);
      }
    }
  };

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

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .floating {
          animation: float 3s ease-in-out infinite;
        }

        .fade-in {
          animation: fadeIn 0.6s ease-out;
        }
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
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <div className="floating" style={{
                width: '5rem',
                height: '5rem',
                margin: '0 auto 1.5rem auto',
                borderRadius: '50%',
                overflow: 'hidden',
                boxShadow: '0 10px 25px rgba(249, 115, 22, 0.3)',
                background: 'white'
              }}>
                <img 
                  src="/logo-semerro.jpg" 
                  alt="Sem Erro Logo"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </div>
              
              <h1 style={{ 
                fontSize: '2rem', 
                fontWeight: 'bold', 
                color: '#1f2937', 
                marginBottom: '0.5rem',
                letterSpacing: '-0.02em'
              }}>
                Área do Cliente
              </h1>
              <p style={{ color: '#6b7280', fontSize: '1rem' }}>
                Acesse sua conta SEM ERRO
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ position: 'relative' }}>
                  <Mail style={{
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
                    type="email"
                    placeholder="Seu e-mail"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem 0.875rem 3rem',
                      border: `2px solid ${errors.email ? '#ef4444' : '#e5e7eb'}`,
                      borderRadius: '0.75rem',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease',
                      outline: 'none',
                      opacity: loading ? 0.6 : 1,
                      cursor: loading ? 'not-allowed' : 'text'
                    }}
                    onFocus={(e) => {
                      if (!errors.email && !loading) e.currentTarget.style.borderColor = '#f97316';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249, 115, 22, 0.1)';
                    }}
                    onBlur={(e) => {
                      if (!errors.email) e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
                {errors.email && (
                  <span style={{ 
                    color: '#ef4444', 
                    fontSize: '0.875rem', 
                    display: 'block', 
                    marginTop: '0.5rem',
                    marginLeft: '0.5rem'
                  }}>
                    {errors.email}
                  </span>
                )}
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
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
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors({ ...errors, password: '' });
                    }}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '0.875rem 3rem 0.875rem 3rem',
                      border: `2px solid ${errors.password ? '#ef4444' : '#e5e7eb'}`,
                      borderRadius: '0.75rem',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease',
                      outline: 'none',
                      opacity: loading ? 0.6 : 1,
                      cursor: loading ? 'not-allowed' : 'text'
                    }}
                    onFocus={(e) => {
                      if (!errors.password && !loading) e.currentTarget.style.borderColor = '#f97316';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249, 115, 22, 0.1)';
                    }}
                    onBlur={(e) => {
                      if (!errors.password) e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    style={{
                      position: 'absolute',
                      right: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      color: '#9ca3af',
                      padding: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'color 0.3s ease',
                      opacity: loading ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) e.currentTarget.style.color = '#f97316';
                    }}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <span style={{ 
                    color: '#ef4444', 
                    fontSize: '0.875rem', 
                    display: 'block', 
                    marginTop: '0.5rem',
                    marginLeft: '0.5rem'
                  }}>
                    {errors.password}
                  </span>
                )}
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
                fontSize: '0.875rem'
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  color: '#4b5563',
                  opacity: loading ? 0.6 : 1
                }}>
                  <input 
                    type="checkbox" 
                    disabled={loading}
                    style={{ 
                      cursor: loading ? 'not-allowed' : 'pointer',
                      width: '1rem',
                      height: '1rem',
                      accentColor: '#f97316'
                    }} 
                  />
                  Lembrar-me
                </label>
                <button
                  type="button"
                  onClick={() => router.push('/alterar-senha')}
                  disabled={loading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#f97316',
                    textDecoration: 'none',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    padding: 0,
                    transition: 'all 0.3s ease',
                    opacity: loading ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.textDecoration = 'underline';
                      e.currentTarget.style.color = '#ea580c';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.textDecoration = 'none';
                    e.currentTarget.style.color = '#f97316';
                  }}
                >
                  Esqueci minha senha
                </button>
              </div>

              <button 
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  background: loading ? '#9ca3af' : 'linear-gradient(to right, #f97316, #ea580c)',
                  color: 'white',
                  padding: '1rem',
                  border: 'none',
                  borderRadius: '0.75rem',
                  fontSize: '1.125rem',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 6px rgba(249, 115, 22, 0.3)',
                  transition: 'all 0.3s ease',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 10px 15px rgba(249, 115, 22, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(249, 115, 22, 0.3)';
                  }
                }}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite'
                    }} />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </button>

              <button 
                type="button"
                onClick={() => router.push('/')}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  backgroundColor: 'transparent',
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.75rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  color: '#6b7280',
                  fontSize: '1rem',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  opacity: loading ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.borderColor = '#f97316';
                    e.currentTarget.style.color = '#f97316';
                    e.currentTarget.style.backgroundColor = '#fff7ed';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.color = '#6b7280';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Voltar para o site
              </button>
            </form>
          </div>

          <div style={{
            textAlign: 'center',
            marginTop: '2rem',
            color: 'white',
            fontSize: '0.875rem'
          }}>
          </div>
        </div>
      </div>
    </>
  );
}