'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { Save, User, Mail, Phone, Briefcase } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const CARGOS = ['Gerente', 'Supervisor', 'Operador', 'Assistente', 'Conferente', 'Repositor', 'Caixa', 'Açougueiro', 'Padeiro']

const fieldWrapClass = 'relative'
const iconClass = 'pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint'
const inputClass = 'w-full rounded-xl bg-surface-2 py-3 pl-10 pr-3.5 text-sm outline-none'
const labelClass = 'mb-2 block text-sm font-semibold text-ink-muted'

export default function EditarColaborador() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    celular: '',
    cargo: ''
  })

  useEffect(() => {
    verificarAutenticacao()
  }, [id])

  function verificarAutenticacao() {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      router.push('/login')
      return
    }
    const user = JSON.parse(userStr)
    if (user.role !== 'aluno') {
      router.push('/login')
      return
    }
    fetchColaborador()
  }

  async function fetchColaborador() {
    try {
      const userStr = localStorage.getItem('user')
      if (!userStr) { router.push('/login'); return }
      const user = JSON.parse(userStr)

      const res = await fetch(`/api/aluno/colaboradores?aluno_id=${user.id}`)
      if (!res.ok) throw new Error('Erro ao carregar')
      const lista = await res.json()
      const data = lista.find((c: any) => c.id === id)

      if (!data) {
        toast.error('Colaborador não encontrado ou acesso negado.')
        router.push('/colaboradores')
        return
      }

      setFormData({
        nome: data.nome,
        email: data.email,
        celular: data.celular || '',
        cargo: data.cargo
      })
    } catch (error) {
      console.error('Erro ao carregar colaborador:', error)
      toast.error('Erro ao carregar dados do colaborador')
    } finally {
      setLoadingData(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/aluno/colaboradores', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          nome: formData.nome,
          email: formData.email,
          celular: formData.celular || null,
          cargo: formData.cargo
        })
      })
      if (!res.ok) throw new Error('Erro ao atualizar')

      toast.success('✅ Colaborador atualizado com sucesso!')
      router.push('/colaboradores')

    } catch (error: any) {
      console.error('Erro ao atualizar:', error)
      toast.error('Erro: ' + error.message)
    } finally {
      setLoading(false)
    }
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

  if (loadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-ink-muted">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1200px] px-6 py-8">
        <PageHeader title="Editar Colaborador" subtitle="Atualize os dados do colaborador" backHref="/colaboradores" />

        <form onSubmit={handleSubmit}>
          <Card className="p-6 sm:p-8">
            <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Nome Completo *</label>
                <div className={fieldWrapClass}>
                  <User size={18} className={iconClass} />
                  <input
                    type="text"
                    required
                    className={inputClass}
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Digite o nome completo"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Email *</label>
                <div className={fieldWrapClass}>
                  <Mail size={18} className={iconClass} />
                  <input
                    type="email"
                    required
                    className={inputClass}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
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
                    maxLength={15}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Cargo *</label>
                <div className={fieldWrapClass}>
                  <Briefcase size={18} className={iconClass} />
                  <select
                    required
                    className={`${inputClass} cursor-pointer`}
                    value={formData.cargo}
                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                  >
                    <option value="">Selecione um cargo</option>
                    {CARGOS.map(cargo => (
                      <option key={cargo} value={cargo}>{cargo}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-surface-2 pt-6">
              <Button type="button" variant="secondary" onClick={() => router.push('/colaboradores')}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={loading} icon={<Save size={18} />}>
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </div>
  )
}
