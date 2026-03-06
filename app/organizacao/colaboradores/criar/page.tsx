'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, UserPlus, Building2 } from 'lucide-react'

interface Empresa {
  id: string
  nome_fantasia: string
}

export default function CriarColaboradorAdminPage() {
  const router = useRouter()
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loadingEmpresas, setLoadingEmpresas] = useState(true)
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  const [form, setForm] = useState({
    empresa_id: '',
    nome: '',
    email: '',
    senha: '',
    celular: '',
    cargo: '',
  })

  useEffect(() => {
    fetch('/api/admin/empresas')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setEmpresas(data)
      })
      .finally(() => setLoadingEmpresas(false))
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setErro('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.empresa_id) { setErro('Selecione uma empresa.'); return }
    if (!form.nome.trim()) { setErro('Nome é obrigatório.'); return }
    if (!form.email.trim()) { setErro('E-mail é obrigatório.'); return }
    if (!form.senha) { setErro('Senha é obrigatória.'); return }
    if (form.senha.length < 6) { setErro('A senha deve ter pelo menos 6 caracteres.'); return }
    if (!form.cargo.trim()) { setErro('Cargo é obrigatório.'); return }

    setSaving(true)
    setErro('')

    const res = await fetch('/api/aluno/colaboradores/criar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        empresa_id: form.empresa_id,
        nome: form.nome.trim(),
        email: form.email.trim().toLowerCase(),
        senha: form.senha,
        celular: form.celular.trim() || undefined,
        cargo: form.cargo.trim(),
      }),
    })

    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      setErro(data.error || 'Erro ao criar colaborador.')
      return
    }

    setSucesso(true)
    setTimeout(() => router.push('/organizacao/colaboradores'), 1500)
  }

  const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '1px solid #e5e7eb',
    borderRadius: '0.5rem',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box' as const,
    backgroundColor: 'white',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '0.375rem',
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        <button
          onClick={() => router.push('/organizacao/colaboradores')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1rem', backgroundColor: 'white',
            border: '1px solid #e5e7eb', borderRadius: '0.5rem',
            cursor: 'pointer', marginBottom: '2rem', color: '#374151'
          }}
        >
          <ArrowLeft size={18} />
          Voltar
        </button>

        <div style={{ backgroundColor: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <div style={{ width: '3rem', height: '3rem', borderRadius: '0.75rem', backgroundColor: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserPlus size={24} style={{ color: '#8b5cf6' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                Novo Colaborador
              </h1>
              <p style={{ color: '#6b7280', margin: 0, fontSize: '0.875rem' }}>
                Cadastre um colaborador em qualquer empresa
              </p>
            </div>
          </div>

          {sucesso && (
            <div style={{ padding: '1rem', backgroundColor: '#d1fae5', borderRadius: '0.5rem', color: '#065f46', marginBottom: '1.5rem', fontWeight: '500' }}>
              Colaborador criado com sucesso! Redirecionando...
            </div>
          )}

          {erro && (
            <div style={{ padding: '1rem', backgroundColor: '#fee2e2', borderRadius: '0.5rem', color: '#991b1b', marginBottom: '1.5rem' }}>
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            <div>
              <label style={labelStyle}>
                <Building2 size={14} style={{ display: 'inline', marginRight: '0.375rem', verticalAlign: 'middle' }} />
                Empresa *
              </label>
              {loadingEmpresas ? (
                <div style={{ ...inputStyle, color: '#9ca3af' }}>Carregando empresas...</div>
              ) : (
                <select
                  name="empresa_id"
                  value={form.empresa_id}
                  onChange={handleChange}
                  style={inputStyle}
                  required
                >
                  <option value="">Selecione uma empresa...</option>
                  {empresas.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.nome_fantasia}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label style={labelStyle}>Nome completo *</label>
              <input
                name="nome"
                type="text"
                placeholder="Ex: João da Silva"
                value={form.nome}
                onChange={handleChange}
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>E-mail *</label>
              <input
                name="email"
                type="email"
                placeholder="colaborador@email.com"
                value={form.email}
                onChange={handleChange}
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Senha *</label>
              <input
                name="senha"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={form.senha}
                onChange={handleChange}
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Cargo *</label>
              <input
                name="cargo"
                type="text"
                placeholder="Ex: Gerente, Supervisor, Atendente..."
                value={form.cargo}
                onChange={handleChange}
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Celular <span style={{ fontWeight: '400', color: '#9ca3af' }}>(opcional)</span></label>
              <input
                name="celular"
                type="tel"
                placeholder="(11) 99999-9999"
                value={form.celular}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', paddingTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => router.push('/organizacao/colaboradores')}
                style={{
                  flex: 1, padding: '0.875rem', backgroundColor: 'white',
                  color: '#374151', border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '500'
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || sucesso}
                style={{
                  flex: 2, padding: '0.875rem', backgroundColor: saving || sucesso ? '#a78bfa' : '#8b5cf6',
                  color: 'white', border: 'none', borderRadius: '0.5rem',
                  cursor: saving || sucesso ? 'not-allowed' : 'pointer',
                  fontSize: '0.95rem', fontWeight: '600'
                }}
              >
                {saving ? 'Salvando...' : sucesso ? 'Salvo!' : 'Criar Colaborador'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
