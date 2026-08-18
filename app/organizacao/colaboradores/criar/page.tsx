'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface Empresa {
  id: string
  nome_fantasia: string
}

const inputClass = 'w-full rounded-xl bg-surface-2 px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-surface-2'
const labelClass = 'mb-1.5 flex items-center text-sm font-medium text-ink-muted'

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
    senha: '123mudar',
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

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[640px] px-6 py-8">
        <PageHeader
          title="Novo Colaborador"
          subtitle="Cadastre um colaborador em qualquer empresa"
          backHref="/organizacao/colaboradores"
        />

        <Card className="p-6">
          {sucesso && (
            <div className="mb-5 rounded-xl bg-teal-tint p-3.5 text-sm font-medium text-teal">
              Colaborador criado com sucesso! Redirecionando...
            </div>
          )}

          {erro && (
            <div className="mb-5 rounded-xl bg-coral-tint p-3.5 text-sm text-coral">
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            <div>
              <label className={labelClass}>
                <Building2 size={14} className="mr-1.5" />
                Empresa *
              </label>
              {loadingEmpresas ? (
                <div className={`${inputClass} text-ink-faint`}>Carregando empresas...</div>
              ) : (
                <select
                  name="empresa_id"
                  value={form.empresa_id}
                  onChange={handleChange}
                  className={`${inputClass} cursor-pointer bg-white`}
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
              <label className={labelClass}>Nome completo *</label>
              <input
                name="nome"
                type="text"
                placeholder="Ex: João da Silva"
                value={form.nome}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className={labelClass}>E-mail *</label>
              <input
                name="email"
                type="email"
                placeholder="colaborador@email.com"
                value={form.email}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className={labelClass}>Senha *</label>
              <input
                name="senha"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={form.senha}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className={labelClass}>Cargo *</label>
              <input
                name="cargo"
                type="text"
                placeholder="Ex: Gerente, Supervisor, Atendente..."
                value={form.cargo}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className={labelClass}>Celular <span className="ml-1 font-normal text-ink-faint">(opcional)</span></label>
              <input
                name="celular"
                type="tel"
                placeholder="(11) 99999-9999"
                value={form.celular}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => router.push('/organizacao/colaboradores')}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-[2]"
                disabled={saving || sucesso}
              >
                {saving ? 'Salvando...' : sucesso ? 'Salvo!' : 'Criar Colaborador'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
