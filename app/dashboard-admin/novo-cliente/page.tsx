'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, UserPlus, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

export default function NovoClientePage() {
  const router = useRouter()
  const [salvando, setSalvando] = useState(false)
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [form, setForm] = useState({ nome: '', email: '', senha: '', programa: '' })

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) { router.push('/login'); return }
    const user = JSON.parse(userData)
    if (user.role !== 'admin') { router.push('/login'); return }
  }, [router])

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim() || !form.email.trim() || !form.senha.trim()) {
      toast.error('Nome, e-mail e senha são obrigatórios.')
      return
    }
    if (form.senha.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    setSalvando(true)
    try {
      const res = await fetch('/api/admin/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Erro ao cadastrar cliente.'); return }
      toast.success(`Cliente "${form.nome}" cadastrado com sucesso!`)
      router.push('/dashboard-admin')
    } catch {
      toast.error('Erro ao cadastrar cliente.')
    } finally {
      setSalvando(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #e5e7eb',
    borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' as const,
    transition: 'border-color 0.15s',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <nav style={{ backgroundColor: '#334155', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', height: '4rem', gap: '1rem' }}>
          <button onClick={() => router.push('/dashboard-admin')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 0.875rem', color: 'white', cursor: 'pointer', fontSize: '0.875rem' }}>
            <ArrowLeft size={16} /> Voltar
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <UserPlus size={18} style={{ color: '#93c5fd' }} />
            <span style={{ color: 'white', fontWeight: '700', fontSize: '1.1rem' }}>Novo Cliente</span>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <form onSubmit={salvar}>
          <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.375rem' }}>
                Nome / Empresa <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text" value={form.nome} onChange={e => set('nome', e.target.value)}
                placeholder="Ex: Supermercado São João" style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = '#334155'}
                onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.375rem' }}>
                E-mail <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="cliente@email.com" style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = '#334155'}
                onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.375rem' }}>
                Senha inicial <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={mostrarSenha ? 'text' : 'password'} value={form.senha} onChange={e => set('senha', e.target.value)}
                  placeholder="Mínimo 6 caracteres" style={{ ...inputStyle, paddingRight: '2.75rem' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#334155'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}
                />
                <button type="button" onClick={() => setMostrarSenha(v => !v)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                  {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>O cliente vai usar essa senha para entrar no sistema.</p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.375rem' }}>
                Programa / Plano
              </label>
              <input
                type="text" value={form.programa} onChange={e => set('programa', e.target.value)}
                placeholder="Ex: Básico, Premium..." style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = '#334155'}
                onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}
              />
            </div>

            <button type="submit" disabled={salvando}
              style={{ padding: '0.875rem', background: salvando ? '#9ca3af' : '#334155', color: 'white', border: 'none', borderRadius: '0.75rem', fontSize: '1rem', fontWeight: '700', cursor: salvando ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}>
              {salvando ? 'Cadastrando...' : 'Cadastrar Cliente'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
