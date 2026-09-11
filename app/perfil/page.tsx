'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, User, Mail, Phone, Briefcase, Building2, Save, Lock, CheckCircle, Camera, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface Colaborador {
  id: string
  nome: string
  email: string
  celular?: string
  cargo?: string
  empresa_id: string
  empresa_nome?: string
  foto_url?: string | null
}

const fieldWrapClass = 'relative'
const iconClass = 'pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint'
const inputClass = 'w-full rounded-xl bg-surface-2 py-3 pl-10 pr-3.5 text-sm outline-none'
const labelClass = 'mb-2 block text-sm font-semibold text-ink-muted'
const sectionTitleClass = 'mb-5 text-xs font-semibold uppercase tracking-wide text-ink-faint'

export default function PerfilPage() {
  const router = useRouter()
  const [colaborador, setColaborador] = useState<Colaborador | null>(null)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [erroFoto, setErroFoto] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    celular: ''
  })

  useEffect(() => {
    carregarPerfil()
  }, [])

  async function carregarPerfil() {
    try {
      let user = null

      // 1. Tentar localStorage primeiro
      try {
        const userType = localStorage.getItem('userType')
        const userStr = localStorage.getItem('user')
        if (userStr) {
          const parsed = JSON.parse(userStr)
          if (parsed.role === 'colaborador' || userType === 'colaborador' || (parsed.empresa_id && parsed.id && !parsed.aluno_id)) {
            user = { ...parsed, role: 'colaborador' }
          }
        }
      } catch { /* ignora */ }

      // 2. Fallback: verificar pelo servidor
      if (!user) {
        const res = await fetch('/api/colaborador/sessao')
        if (!res.ok) {
          window.location.href = '/login'
          return
        }
        user = await res.json()
        localStorage.setItem('user', JSON.stringify({ ...user, role: 'colaborador' }))
        localStorage.setItem('userType', 'colaborador')
      }

      setColaborador({
        id: user.id,
        nome: user.nome,
        email: user.email,
        celular: user.celular || '',
        cargo: user.cargo,
        empresa_id: user.empresa_id,
        empresa_nome: user.empresa_nome,
        foto_url: user.foto_url ?? null,
      })
      setFormData({
        nome: user.nome,
        celular: user.celular || ''
      })
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
      window.location.href = '/login'
    } finally {
      setLoading(false)
    }
  }

  async function handleFotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !colaborador) return

    setUploadingFoto(true)
    setErroFoto(null)
    try {
      // 1. Enviar arquivo para o storage
      const form = new FormData()
      form.append('file', file)
      form.append('path', `colaboradores/${colaborador.id}/avatar-${Date.now()}`)

      const uploadRes = await fetch('/api/upload-foto', { method: 'POST', body: form })
      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}))
        throw new Error(`Upload falhou: ${err.error || uploadRes.status}`)
      }
      const { publicUrl } = await uploadRes.json()

      // 2. Salvar URL no banco via endpoint dedicado
      const saveRes = await fetch('/api/colaborador/foto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foto_url: publicUrl }),
      })
      if (!saveRes.ok) {
        const err = await saveRes.json().catch(() => ({}))
        throw new Error(`Salvar no banco falhou: ${err.error || saveRes.status}`)
      }

      setColaborador(prev => prev ? { ...prev, foto_url: publicUrl } : prev)
      try {
        const userStr = localStorage.getItem('user')
        if (userStr) localStorage.setItem('user', JSON.stringify({ ...JSON.parse(userStr), foto_url: publicUrl }))
      } catch {}
      toast.success('Foto atualizada com sucesso!')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar foto'
      setErroFoto(msg)
      toast.error(msg)
    } finally {
      setUploadingFoto(false)
      e.target.value = ''
    }
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    if (!colaborador) return

    setSalvando(true)
    setSucesso(false)

    try {
      const res = await fetch('/api/colaborador/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: formData.nome, celular: formData.celular })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao salvar')
      }

      // Atualizar localStorage
      try {
        const userStr = localStorage.getItem('user')
        if (userStr) {
          const parsed = JSON.parse(userStr)
          localStorage.setItem('user', JSON.stringify({
            ...parsed,
            nome: formData.nome,
            celular: formData.celular
          }))
        }
      } catch {}

      setColaborador(prev => prev ? { ...prev, nome: formData.nome, celular: formData.celular } : prev)
      setSucesso(true)
      setTimeout(() => setSucesso(false), 3000)
    } catch (error: any) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar perfil: ' + error.message)
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
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-ink-muted">Carregando perfil...</p>
      </div>
    )
  }

  if (!colaborador) return null

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[700px] px-6 py-8">
        <button
          onClick={() => router.push('/dashboard-funcionario')}
          className="mb-5 inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-sm font-medium text-ink-muted shadow-soft-sm transition-colors hover:text-ink cursor-pointer"
        >
          <ArrowLeft size={16} />
          Voltar ao Dashboard
        </button>

        {/* Cabeçalho do perfil */}
        <Card className="mb-5 flex items-center gap-5 p-6">
          <div
            className="relative flex-shrink-0 cursor-pointer"
            onClick={() => document.getElementById('foto-input')?.click()}
            title="Clique para trocar a foto"
          >
            {colaborador.foto_url ? (
              <img
                src={colaborador.foto_url}
                alt={colaborador.nome}
                className="h-16 w-16 rounded-full border-2 border-surface-2 object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-tint">
                <span className="text-xl font-bold text-brand">{colaborador.nome.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <div className="absolute bottom-0 right-0 flex h-[1.4rem] w-[1.4rem] items-center justify-center rounded-full border-2 border-white bg-brand">
              {uploadingFoto ? <Loader2 size={10} className="animate-spin text-white" /> : <Camera size={10} className="text-white" />}
            </div>
          </div>
          <input id="foto-input" type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFotoUpload} />
          <div>
            <h1 className="font-display text-xl font-bold text-ink">{colaborador.nome}</h1>
            {erroFoto && <p className="mt-1 max-w-[280px] text-xs text-coral">⚠️ {erroFoto}</p>}
            <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted">
              <Building2 size={14} />
              {colaborador.empresa_nome}
              {colaborador.cargo && ` • ${colaborador.cargo}`}
            </p>
          </div>
        </Card>

        {/* Dados fixos (somente leitura) */}
        <Card className="mb-5 p-6 sm:p-7">
          <h2 className={sectionTitleClass}>Informações da conta</h2>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4 rounded-xl bg-surface-2 p-3.5">
              <Mail size={18} className="flex-shrink-0 text-ink-faint" />
              <div>
                <p className="text-xs text-ink-faint">E-mail</p>
                <p className="mt-0.5 text-sm font-medium text-ink">{colaborador.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl bg-surface-2 p-3.5">
              <Briefcase size={18} className="flex-shrink-0 text-ink-faint" />
              <div>
                <p className="text-xs text-ink-faint">Cargo</p>
                <p className="mt-0.5 text-sm font-medium text-ink">{colaborador.cargo || '—'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl bg-surface-2 p-3.5">
              <Building2 size={18} className="flex-shrink-0 text-ink-faint" />
              <div>
                <p className="text-xs text-ink-faint">Empresa</p>
                <p className="mt-0.5 text-sm font-medium text-ink">{colaborador.empresa_nome || '—'}</p>
              </div>
            </div>
          </div>

          <p className="mt-4 text-xs text-ink-faint">E-mail, cargo e empresa só podem ser alterados pelo seu gestor.</p>
        </Card>

        {/* Formulário editável */}
        <Card className="mb-5 p-6 sm:p-7">
          <h2 className={sectionTitleClass}>Editar meus dados</h2>

          <form onSubmit={handleSalvar}>
            <div className="mb-6 flex flex-col gap-5">
              <div>
                <label className={labelClass}>Nome completo</label>
                <div className={fieldWrapClass}>
                  <User size={18} className={iconClass} />
                  <input
                    type="text"
                    required
                    className={inputClass}
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Celular</label>
                <div className={fieldWrapClass}>
                  <Phone size={18} className={iconClass} />
                  <input
                    type="tel"
                    className={inputClass}
                    value={formData.celular}
                    onChange={(e) => setFormData({ ...formData, celular: formatPhone(e.target.value) })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
            </div>

            {sucesso && (
              <div className="mb-5 flex items-center gap-2 rounded-xl bg-teal-tint px-4 py-3.5">
                <CheckCircle size={18} className="text-teal" />
                <span className="text-sm font-medium text-teal">Perfil atualizado com sucesso!</span>
              </div>
            )}

            <Button type="submit" variant="primary" disabled={salvando} icon={<Save size={18} />}>
              {salvando ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </form>
        </Card>

        {/* Alterar senha */}
        <Card className="p-6 sm:p-7">
          <h2 className={sectionTitleClass}>Segurança</h2>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-tint">
                <Lock size={18} className="text-blue" />
              </div>
              <div>
                <p className="text-sm font-medium text-ink">Senha</p>
                <p className="text-xs text-ink-faint">Altere sua senha de acesso</p>
              </div>
            </div>
            <Button variant="secondary" onClick={() => router.push('/alterar-senha')}>
              Alterar Senha
            </Button>
          </div>
        </Card>

      </div>
    </div>
  )
}
