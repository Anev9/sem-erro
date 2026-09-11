'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { User, Mail, Phone, Lock, Briefcase, Building2, CheckCircle, Copy, Check, Save } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface Empresa {
  id: string
  nome_fantasia: string
}

const CARGOS = ['Gerente', 'Supervisor', 'Operador', 'Assistente', 'Conferente', 'Repositor', 'Caixa', 'Açougueiro', 'Padeiro']

const fieldWrapClass = 'relative'
const iconClass = 'pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint'
const inputClass = 'w-full rounded-xl bg-surface-2 py-3 pl-10 pr-3.5 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60'
const labelClass = 'mb-2 block text-sm font-semibold text-ink-muted'

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
    senha: '123mudar',
    confirmarSenha: '123mudar'
  })

  useEffect(() => {
    verificarAutenticacao()
  }, [])

  async function verificarAutenticacao() {
    try {
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        toast.warning('Você precisa estar logado como cliente')
        router.push('/login')
        return
      }

      const user = JSON.parse(userStr)

      if (user.role !== 'aluno') {
        toast.warning('Apenas clientes podem cadastrar colaboradores')
        router.push('/login')
        return
      }

      setAlunoId(user.id)
      await carregarEmpresas(user.id)

    } catch (error) {
      console.error('Erro ao verificar autenticação:', error)
      toast.error('Erro ao verificar autenticação')
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
      toast.warning('Por favor, selecione uma empresa/loja!')
      return
    }

    if (formData.senha !== formData.confirmarSenha) {
      toast.warning('As senhas não coincidem!')
      return
    }

    if (formData.senha.length < 6) {
      toast.warning('A senha deve ter pelo menos 6 caracteres!')
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
      toast.error(error.message || 'Erro ao cadastrar colaborador')
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
    <div className="min-h-screen">
      <div className="mx-auto max-w-[900px] px-6 py-8">
        <PageHeader title="Novo Colaborador" subtitle="Preencha os dados do colaborador" backHref="/colaboradores" />

        <Card className="p-6 sm:p-8">
          {credenciais ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-teal-tint">
                <CheckCircle size={32} className="text-teal" />
              </div>
              <h3 className="mb-2 font-display text-xl font-bold text-ink">Colaborador cadastrado com sucesso!</h3>
              <p className="mb-6 text-sm text-ink-muted">Anote e envie os dados de acesso para o colaborador.</p>

              <div className="mx-auto mb-6 max-w-[400px] rounded-2xl bg-surface-2 p-6 text-left">
                <div className="mb-4">
                  <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Email</span>
                  <p className="mt-1 text-base font-semibold text-ink">{credenciais.email}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Senha</span>
                  <p className="mt-1 text-base font-semibold text-ink">{credenciais.senha}</p>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                <Button
                  variant="primary"
                  onClick={copiarCredenciais}
                  icon={copiado ? <Check size={18} /> : <Copy size={18} />}
                >
                  {copiado ? 'Copiado!' : 'Copiar dados'}
                </Button>
                <Button variant="secondary" onClick={() => router.push('/colaboradores')}>
                  Ir para colaboradores
                </Button>
              </div>
            </div>
          ) : loadingEmpresas ? (
            <div className="py-12 text-center text-sm text-ink-muted">Carregando empresas...</div>
          ) : empresas.length === 0 ? (
            <div className="py-12 text-center">
              <Building2 size={48} className="mx-auto mb-4 text-ink-faint" />
              <h3 className="mb-2 text-lg font-semibold text-ink">Nenhuma empresa cadastrada</h3>
              <p className="text-sm text-ink-muted">Você precisa cadastrar pelo menos uma empresa antes de adicionar colaboradores.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Empresa/Loja *</label>
                  <div className={fieldWrapClass}>
                    <Building2 size={18} className={iconClass} />
                    <select
                      required
                      className={`${inputClass} cursor-pointer`}
                      value={formData.empresa_id}
                      onChange={(e) => setFormData({ ...formData, empresa_id: e.target.value })}
                      disabled={empresas.length === 1}
                    >
                      <option value="">Selecione a empresa/loja</option>
                      {empresas.map((empresa) => (
                        <option key={empresa.id} value={empresa.id}>{empresa.nome_fantasia}</option>
                      ))}
                    </select>
                  </div>
                </div>

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
                  <label className={labelClass}>Email (login) *</label>
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

                <div>
                  <label className={labelClass}>Senha *</label>
                  <div className={fieldWrapClass}>
                    <Lock size={18} className={iconClass} />
                    <input
                      type="password"
                      required
                      className={inputClass}
                      value={formData.senha}
                      onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                      placeholder="Mínimo 6 caracteres"
                      minLength={6}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Confirmar Senha *</label>
                  <div className={fieldWrapClass}>
                    <Lock size={18} className={iconClass} />
                    <input
                      type="password"
                      required
                      className={inputClass}
                      value={formData.confirmarSenha}
                      onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })}
                      placeholder="Digite a senha novamente"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-surface-2 pt-6">
                <Button type="button" variant="secondary" onClick={() => router.push('/colaboradores')}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" disabled={loading} icon={<Save size={18} />}>
                  {loading ? 'Cadastrando...' : 'Cadastrar Colaborador'}
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
