'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, User, Mail, Phone, Save, Lock, CheckCircle, Camera, Loader2, Package } from 'lucide-react'

interface AlunoProfile {
  id: number
  clientes: string | null
  'e-mail': string | null
  telefone: string | null
  foto_url: string | null
  programa: string
  tipo: string | null
}

export default function PerfilAlunoPage() {
  const router = useRouter()
  const [aluno, setAluno] = useState<AlunoProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [formData, setFormData] = useState({ clientes: '', telefone: '' })

  useEffect(() => { carregarPerfil() }, [])

  async function carregarPerfil() {
    try {
      const res = await fetch('/api/aluno/perfil')
      if (!res.ok) { router.push('/login'); return }
      const data = await res.json()
      setAluno(data)
      setFormData({ clientes: data.clientes || '', telefone: data.telefone || '' })
    } catch {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  async function handleFotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !aluno) return

    setUploadingFoto(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('path', `alunos/${aluno.id}/avatar`)

      const res = await fetch('/api/upload-foto', { method: 'POST', body: form })
      if (!res.ok) throw new Error('Erro ao enviar foto')
      const { publicUrl } = await res.json()

      await fetch('/api/aluno/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foto_url: publicUrl }),
      })

      setAluno(prev => prev ? { ...prev, foto_url: publicUrl } : prev)
      try {
        const userStr = localStorage.getItem('user')
        if (userStr) localStorage.setItem('user', JSON.stringify({ ...JSON.parse(userStr), foto_url: publicUrl }))
      } catch {}
      toast.success('Foto atualizada com sucesso!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar foto')
    } finally {
      setUploadingFoto(false)
      e.target.value = ''
    }
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    if (!aluno) return

    setSalvando(true)
    setSucesso(false)
    try {
      const res = await fetch('/api/aluno/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientes: formData.clientes, telefone: formData.telefone }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Erro ao salvar')

      setAluno(prev => prev ? { ...prev, clientes: formData.clientes, telefone: formData.telefone } : prev)
      try {
        const userStr = localStorage.getItem('user')
        if (userStr) localStorage.setItem('user', JSON.stringify({ ...JSON.parse(userStr), full_name: formData.clientes }))
      } catch {}
      setSucesso(true)
      setTimeout(() => setSucesso(false), 3000)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  const formatPhone = (v: string) =>
    v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 15)

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#6b7280' }}>Carregando perfil...</p>
    </div>
  )

  if (!aluno) return null

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <style>{`
        .fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .form-input { width: 100%; padding: 0.875rem 1rem 0.875rem 3rem; border: 2px solid #e5e7eb; border-radius: 0.75rem; font-size: 0.95rem; outline: none; transition: all 0.2s ease; background: white; box-sizing: border-box; }
        .form-input:focus { border-color: #f97316; box-shadow: 0 0 0 3px rgba(249,115,22,0.1); }
        .form-input:disabled { background: #f9fafb; color: #9ca3af; cursor: not-allowed; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <button
            onClick={() => router.push('/dashboard-aluno')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.85)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '1rem', padding: 0 }}
          >
            <ArrowLeft size={16} /> Voltar ao Dashboard
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ position: 'relative', flexShrink: 0, cursor: 'pointer' }} onClick={() => document.getElementById('foto-input-aluno')?.click()} title="Clique para trocar a foto">
              {aluno.foto_url ? (
                <img src={aluno.foto_url} alt={aluno.clientes || ''} style={{ width: '4rem', height: '4rem', borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.5)' }} />
              ) : (
                <div style={{ width: '4rem', height: '4rem', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {(aluno.clientes || aluno['e-mail'] || 'A').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#c2410c', borderRadius: '50%', width: '1.4rem', height: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
                {uploadingFoto ? <Loader2 size={10} style={{ color: 'white', animation: 'spin 1s linear infinite' }} /> : <Camera size={10} style={{ color: 'white' }} />}
              </div>
            </div>
            <input id="foto-input-aluno" type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleFotoUpload} />

            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'white', margin: 0 }}>
                {aluno.clientes || 'Meu Perfil'}
              </h1>
              <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)', margin: '0.25rem 0 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Package size={14} /> {aluno.programa}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Dados fixos */}
        <div className="fade-in" style={{ backgroundColor: 'white', borderRadius: '1rem', padding: '1.75rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '0.8rem', fontWeight: '600', color: '#6b7280', margin: '0 0 1.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Informações da conta
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1rem', backgroundColor: '#f9fafb', borderRadius: '0.75rem' }}>
            <Mail size={18} style={{ color: '#9ca3af', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>E-mail</p>
              <p style={{ fontSize: '0.95rem', color: '#374151', margin: '0.125rem 0 0', fontWeight: '500' }}>{aluno['e-mail']}</p>
            </div>
          </div>
        </div>

        {/* Formulário editável */}
        <div className="fade-in" style={{ backgroundColor: 'white', borderRadius: '1rem', padding: '1.75rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '0.8rem', fontWeight: '600', color: '#6b7280', margin: '0 0 1.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Editar meus dados
          </h2>

          <form onSubmit={handleSalvar}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>Nome / Empresa</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  <input type="text" className="form-input" value={formData.clientes} onChange={(e) => setFormData({ ...formData, clientes: e.target.value })} placeholder="Seu nome ou empresa" />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>Telefone</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  <input type="tel" className="form-input" value={formData.telefone} onChange={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })} placeholder="(00) 00000-0000" />
                </div>
              </div>
            </div>

            {sucesso && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 1rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.75rem', marginBottom: '1.25rem' }}>
                <CheckCircle size={18} style={{ color: '#16a34a' }} />
                <span style={{ fontSize: '0.9rem', color: '#15803d', fontWeight: '500' }}>Perfil atualizado com sucesso!</span>
              </div>
            )}

            <button type="submit" disabled={salvando} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 1.75rem', backgroundColor: salvando ? '#9ca3af' : '#f97316', color: 'white', border: 'none', borderRadius: '0.75rem', cursor: salvando ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '0.95rem' }}>
              <Save size={18} />
              {salvando ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>
        </div>

        {/* Segurança */}
        <div className="fade-in" style={{ backgroundColor: 'white', borderRadius: '1rem', padding: '1.75rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '0.8rem', fontWeight: '600', color: '#6b7280', margin: '0 0 1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Segurança</h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '2.5rem', height: '2.5rem', backgroundColor: '#fff7ed', borderRadius: '0.625rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lock size={18} style={{ color: '#f97316' }} />
              </div>
              <div>
                <p style={{ fontSize: '0.95rem', fontWeight: '500', color: '#1f2937', margin: 0 }}>Senha</p>
                <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: '0.125rem 0 0' }}>Altere sua senha de acesso</p>
              </div>
            </div>
            <button onClick={() => router.push('/alterar-senha')} style={{ padding: '0.625rem 1.25rem', backgroundColor: 'white', color: '#f97316', border: '2px solid #f97316', borderRadius: '0.625rem', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' }}>
              Alterar Senha
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
