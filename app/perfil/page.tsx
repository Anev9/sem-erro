'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Briefcase,
  Building2,
  Save,
  Lock,
  CheckCircle
} from 'lucide-react'

interface Colaborador {
  id: string
  nome: string
  email: string
  celular?: string
  cargo?: string
  empresa_id: string
  auth_id: string
  empresas?: { nome_fantasia: string }
}

export default function PerfilPage() {
  const router = useRouter()
  const [colaborador, setColaborador] = useState<Colaborador | null>(null)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    celular: ''
  })

  useEffect(() => {
    carregarPerfil()
  }, [])

  async function carregarPerfil() {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('colaboradores')
        .select(`*, empresas ( nome_fantasia )`)
        .eq('auth_id', user.id)
        .eq('ativo', true)
        .single()

      if (error || !data) {
        alert('Perfil não encontrado.')
        router.push('/login')
        return
      }

      setColaborador(data)
      setFormData({
        nome: data.nome,
        celular: data.celular || ''
      })
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    if (!colaborador) return

    setSalvando(true)
    setSucesso(false)

    try {
      const { error } = await supabase
        .from('colaboradores')
        .update({
          nome: formData.nome.trim(),
          celular: formData.celular.trim() || null
        })
        .eq('id', colaborador.id)
        .eq('auth_id', colaborador.auth_id) // segurança extra

      if (error) throw error

      setColaborador(prev => prev ? { ...prev, nome: formData.nome, celular: formData.celular } : prev)
      setSucesso(true)
      setTimeout(() => setSucesso(false), 3000)
    } catch (error: any) {
      console.error('Erro ao salvar:', error)
      alert('Erro ao salvar perfil: ' + error.message)
    } finally {
      setSalvando(false)
    }
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#6b7280' }}>Carregando perfil...</p>
      </div>
    )
  }

  if (!colaborador) return null

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <style>{`
        .fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .form-input { width: 100%; padding: 0.875rem 1rem 0.875rem 3rem; border: 2px solid #e5e7eb; border-radius: 0.75rem; font-size: 0.95rem; outline: none; transition: all 0.2s ease; background: white; box-sizing: border-box; }
        .form-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
        .form-input:disabled { background: #f9fafb; color: #9ca3af; cursor: not-allowed; }
      `}</style>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        padding: '2rem',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <button
            onClick={() => router.push('/dashboard-funcionario')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.85)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '1rem', padding: 0 }}
          >
            <ArrowLeft size={16} />
            Voltar ao Dashboard
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ width: '4rem', height: '4rem', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <User size={32} style={{ color: 'white' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'white', margin: 0 }}>
                {colaborador.nome}
              </h1>
              <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)', margin: '0.25rem 0 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building2 size={14} />
                {colaborador.empresas?.nome_fantasia}
                {colaborador.cargo && ` • ${colaborador.cargo}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Dados fixos (somente leitura) */}
        <div className="fade-in" style={{ backgroundColor: 'white', borderRadius: '1rem', padding: '1.75rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '0.8rem', fontWeight: '600', color: '#6b7280', margin: '0 0 1.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Informações da conta
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1rem', backgroundColor: '#f9fafb', borderRadius: '0.75rem' }}>
              <Mail size={18} style={{ color: '#9ca3af', flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>E-mail</p>
                <p style={{ fontSize: '0.95rem', color: '#374151', margin: '0.125rem 0 0', fontWeight: '500' }}>{colaborador.email}</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1rem', backgroundColor: '#f9fafb', borderRadius: '0.75rem' }}>
              <Briefcase size={18} style={{ color: '#9ca3af', flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>Cargo</p>
                <p style={{ fontSize: '0.95rem', color: '#374151', margin: '0.125rem 0 0', fontWeight: '500' }}>{colaborador.cargo || '—'}</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1rem', backgroundColor: '#f9fafb', borderRadius: '0.75rem' }}>
              <Building2 size={18} style={{ color: '#9ca3af', flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>Empresa</p>
                <p style={{ fontSize: '0.95rem', color: '#374151', margin: '0.125rem 0 0', fontWeight: '500' }}>{colaborador.empresas?.nome_fantasia || '—'}</p>
              </div>
            </div>
          </div>

          <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: '1rem 0 0' }}>
            E-mail, cargo e empresa só podem ser alterados pelo seu gestor.
          </p>
        </div>

        {/* Formulário editável */}
        <div className="fade-in" style={{ backgroundColor: 'white', borderRadius: '1rem', padding: '1.75rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '0.8rem', fontWeight: '600', color: '#6b7280', margin: '0 0 1.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Editar meus dados
          </h2>

          <form onSubmit={handleSalvar}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>

              {/* Nome */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  Nome completo
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>

              {/* Celular */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  Celular
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  <input
                    type="tel"
                    className="form-input"
                    value={formData.celular}
                    onChange={(e) => setFormData({ ...formData, celular: formatPhone(e.target.value) })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
            </div>

            {sucesso && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 1rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.75rem', marginBottom: '1.25rem' }}>
                <CheckCircle size={18} style={{ color: '#16a34a' }} />
                <span style={{ fontSize: '0.9rem', color: '#15803d', fontWeight: '500' }}>Perfil atualizado com sucesso!</span>
              </div>
            )}

            <button
              type="submit"
              disabled={salvando}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 1.75rem', backgroundColor: salvando ? '#9ca3af' : '#3b82f6', color: 'white', border: 'none', borderRadius: '0.75rem', cursor: salvando ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '0.95rem' }}
            >
              <Save size={18} />
              {salvando ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>
        </div>

        {/* Alterar senha */}
        <div className="fade-in" style={{ backgroundColor: 'white', borderRadius: '1rem', padding: '1.75rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '0.8rem', fontWeight: '600', color: '#6b7280', margin: '0 0 1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Segurança
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '2.5rem', height: '2.5rem', backgroundColor: '#eff6ff', borderRadius: '0.625rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lock size={18} style={{ color: '#3b82f6' }} />
              </div>
              <div>
                <p style={{ fontSize: '0.95rem', fontWeight: '500', color: '#1f2937', margin: 0 }}>Senha</p>
                <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: '0.125rem 0 0' }}>Altere sua senha de acesso</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/alterar-senha')}
              style={{ padding: '0.625rem 1.25rem', backgroundColor: 'white', color: '#3b82f6', border: '2px solid #3b82f6', borderRadius: '0.625rem', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' }}
            >
              Alterar Senha
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
