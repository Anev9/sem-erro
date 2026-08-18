'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Save, Trash2, CalendarX } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const inputClass = 'w-full rounded-xl bg-surface-2 px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-surface-2'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink-muted">{label}</label>
      {children}
    </div>
  )
}

export default function EditarEmpresaPage() {
  const router = useRouter()
  const params = useParams()
  const id = Number(params.id)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [empresa, setEmpresa] = useState({
    clientes: '',
    nome_aluno: '',
    cnpj: '',
    tipo_empresa: '',
    ativo: true,
    auditor_atribui_acao: false,
    endereco: '',
    estado: '',
    cidade: '',
    programa: '',
    'e-mail': '',
    telefone: '',
    senha: '',
    tipo: 'aluno',
    data_saida: '',
    origem: 'programa',
  })

  const estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ]

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) { router.push('/login'); return }
    const user = JSON.parse(userData)
    if (user.role !== 'admin') { router.push('/login'); return }
    buscarEmpresa()
  }, [id, router])

  async function buscarEmpresa() {
    try {
      const { data, error } = await supabase
        .from('alunos')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      if (data) setEmpresa({
        clientes: data.clientes ?? '',
        nome_aluno: data.nome_aluno ?? '',
        cnpj: data.cnpj ?? '',
        tipo_empresa: data.tipo_empresa ?? '',
        ativo: data.ativo ?? true,
        auditor_atribui_acao: data.auditor_atribui_acao ?? false,
        endereco: (data as Record<string, unknown>).endereco as string ?? '',
        estado: data.estado ?? '',
        cidade: data.cidade ?? '',
        programa: data.programa ?? '',
        'e-mail': data['e-mail'] ?? '',
        telefone: data.telefone ?? '',
        senha: (data as Record<string, unknown>).senha as string ?? '',
        tipo: (data as Record<string, unknown>).tipo as string ?? 'aluno',
        data_saida: data.data_saida ?? '',
        origem: (data as Record<string, unknown>).origem as string ?? 'programa',
      })
    } catch (error) {
      console.error('Erro ao buscar empresa:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  async function salvar() {
    setSaving(true)
    try {
      const payload = { ...empresa, data_saida: empresa.data_saida || null }
      const { error } = await supabase
        .from('alunos')
        .update(payload)
        .eq('id', id)

      if (error) throw error
      toast.success('Salvo com sucesso!')
      router.push('/organizacao/grupos-empresa')
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function deletar() {
    if (!confirm('Tem certeza que deseja deletar esta empresa?')) return

    try {
      const { error } = await supabase
        .from('alunos')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Deletado com sucesso!')
      router.push('/organizacao/grupos-empresa')
    } catch (error) {
      console.error('Erro ao deletar:', error)
      toast.error('Erro ao deletar')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-2">
        <p className="text-ink-muted">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[900px] px-6 py-8">
        <PageHeader
          title={`Editando empresa: ${empresa.clientes || id}`}
          subtitle="Atualize os dados da empresa abaixo"
          backHref="/organizacao/grupos-empresa"
        />

        <Card className="p-8">
          <div className="grid gap-5">
            <Field label="Nome da empresa">
              <input
                type="text"
                value={empresa.clientes}
                onChange={(e) => setEmpresa({ ...empresa, clientes: e.target.value })}
                className={inputClass}
              />
            </Field>

            <Field label="Nome do aluno">
              <input
                type="text"
                value={empresa.nome_aluno}
                onChange={(e) => setEmpresa({ ...empresa, nome_aluno: e.target.value })}
                className={inputClass}
              />
            </Field>

            <Field label="CNPJ">
              <input
                type="text"
                value={empresa.cnpj}
                onChange={(e) => setEmpresa({ ...empresa, cnpj: e.target.value })}
                placeholder="00.000.000/0000-00"
                className={inputClass}
              />
            </Field>

            <Field label="Tipo de empresa">
              <input
                type="text"
                value={empresa.tipo_empresa}
                onChange={(e) => setEmpresa({ ...empresa, tipo_empresa: e.target.value })}
                placeholder="Ex: Supermercado, Farmácia, etc"
                className={inputClass}
              />
            </Field>

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={empresa.ativo}
                onChange={(e) => setEmpresa({ ...empresa, ativo: e.target.checked })}
                className="h-5 w-5 cursor-pointer accent-brand"
              />
              <span className="text-sm font-medium text-ink">Ativa?</span>
            </label>

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={empresa.auditor_atribui_acao}
                onChange={(e) => setEmpresa({ ...empresa, auditor_atribui_acao: e.target.checked })}
                className="h-5 w-5 cursor-pointer accent-brand"
              />
              <span className="text-sm font-medium text-ink">
                Auditor atribui ação no checklist?
              </span>
            </label>

            <Field label="Endereço">
              <input
                type="text"
                value={empresa.endereco}
                onChange={(e) => setEmpresa({ ...empresa, endereco: e.target.value })}
                placeholder="Rua, número, bairro"
                className={inputClass}
              />
            </Field>

            <Field label="Estado">
              <select
                value={empresa.estado}
                onChange={(e) => setEmpresa({ ...empresa, estado: e.target.value })}
                className={`${inputClass} cursor-pointer bg-white`}
              >
                <option value="">-- Selecione um estado --</option>
                {estados.map(estado => (
                  <option key={estado} value={estado}>{estado}</option>
                ))}
              </select>
            </Field>

            <Field label="Cidade">
              <input
                type="text"
                value={empresa.cidade}
                onChange={(e) => setEmpresa({ ...empresa, cidade: e.target.value })}
                className={inputClass}
              />
            </Field>

            <hr className="border-t border-surface-2" />

            <Field label="Data de Saída do App">
              <div className="flex items-center gap-1.5 text-ink-faint">
                <CalendarX size={15} />
              </div>
              <input
                type="date"
                value={empresa.data_saida}
                onChange={(e) => setEmpresa({ ...empresa, data_saida: e.target.value })}
                className={`${inputClass} mt-1.5`}
              />
              <p className="mt-1.5 text-xs text-ink-faint">
                Preencha apenas se o cliente encerrou o uso do app. Deixe em branco para limpar.
              </p>
            </Field>

            <Field label="Programa">
              <input
                type="text"
                value={empresa.programa}
                onChange={(e) => setEmpresa({ ...empresa, programa: e.target.value })}
                className={inputClass}
              />
            </Field>

            <Field label="Tipo de cliente">
              <div className="flex gap-2">
                {([
                  { value: 'pagante', label: 'Pagante' },
                  { value: 'programa', label: 'Programa' },
                ] as const).map(opt => {
                  const active = empresa.origem === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setEmpresa({ ...empresa, origem: opt.value })}
                      className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${
                        active
                          ? 'border-brand bg-brand text-white'
                          : 'border-transparent bg-white text-ink-muted '
                      }`}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
              <p className="mt-1.5 text-xs text-ink-faint">
                Pagante: cliente que paga pelo acesso. Programa: aluno vinculado a um programa/parceria.
              </p>
            </Field>

            <Field label="Email">
              <input
                type="email"
                value={empresa['e-mail']}
                onChange={(e) => setEmpresa({ ...empresa, 'e-mail': e.target.value })}
                className={inputClass}
              />
            </Field>

            <Field label="Telefone">
              <input
                type="text"
                value={empresa.telefone}
                onChange={(e) => setEmpresa({ ...empresa, telefone: e.target.value })}
                className={inputClass}
              />
            </Field>

            <Field label="Senha de Acesso">
              <input
                type="text"
                value={empresa.senha}
                onChange={(e) => setEmpresa({ ...empresa, senha: e.target.value })}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="primary" icon={<Save size={16} />} onClick={salvar} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button variant="danger" icon={<Trash2 size={16} />} onClick={deletar}>
              Deletar
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
