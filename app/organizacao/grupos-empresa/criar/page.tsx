'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Building2, Mail, MapPin, Lock, CheckSquare, CalendarX } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const estados = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
  'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
  'RS','RO','RR','SC','SP','SE','TO'
]

const inputClass = 'w-full rounded-xl bg-surface-2 px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-surface-2'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink-muted">{label}</label>
      {children}
    </div>
  )
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="mb-5 flex items-center gap-2 border-b border-surface-2 pb-3">
      <span className="text-ink-faint">{icon}</span>
      <h2 className="font-display text-sm font-semibold text-ink">{title}</h2>
    </div>
  )
}

export default function CriarEmpresaPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) { router.push('/login'); return }
    const user = JSON.parse(userData)
    if (user.role !== 'admin') { router.push('/login') }
  }, [router])

  const [form, setForm] = useState({
    clientes: '',
    nome_aluno: '',
    cnpj: '',
    tipo_empresa: '',
    programa: '',
    'e-mail': '',
    telefone: '',
    celular: '',
    senha: '',
    endereco: '',
    cidade: '',
    estado: '',
    ativo: true,
    auditor_atribui_acao: false,
    tipo: 'aluno',
    data_saida: '',
    origem: 'programa',
  })

  function set(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  function validar() {
    const e: Record<string, string> = {}
    if (!form.clientes.trim()) e.clientes = 'Nome da empresa é obrigatório'
    if (!form['e-mail'].trim()) {
      e['e-mail'] = 'Email é obrigatório'
    } else if (!/\S+@\S+\.\S+/.test(form['e-mail'])) {
      e['e-mail'] = 'Email inválido'
    }
    if (!form.senha.trim()) e.senha = 'Senha de acesso é obrigatória'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function salvar() {
    if (!validar()) return
    setSaving(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { celular, ...dadosParaSalvar } = form
      const payload = { ...dadosParaSalvar, data_saida: dadosParaSalvar.data_saida || null }
      const { error } = await supabase.from('alunos').insert([payload])
      if (error) throw error
      router.push('/organizacao/grupos-empresa')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar'
      toast.error('Erro: ' + msg)
    } finally {
      setSaving(false)
    }
  }

  function fieldClass(field: string) {
    return `${inputClass} ${errors[field] ? 'border border-coral bg-coral-tint focus:ring-coral-tint' : ''}`
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[900px] px-6 py-8">
        <PageHeader
          title="Novo Grupo de Empresa"
          subtitle="Preencha os dados abaixo para cadastrar um novo cliente"
          backHref="/organizacao/grupos-empresa"
        />

        <div className="grid gap-4">

          <Card className="p-6">
            <SectionTitle icon={<Building2 size={18} />} title="Dados da Empresa" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Nome da empresa *">
                  <input
                    type="text"
                    placeholder="Ex: Supermercado Silva Ltda"
                    value={form.clientes}
                    onChange={(e) => set('clientes', e.target.value)}
                    className={fieldClass('clientes')}
                  />
                  {errors.clientes && <p className="mt-1 text-xs text-coral">{errors.clientes}</p>}
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Nome do aluno">
                  <input
                    type="text"
                    placeholder="Ex: Maria Silva"
                    value={form.nome_aluno}
                    onChange={(e) => set('nome_aluno', e.target.value)}
                    className={fieldClass('nome_aluno')}
                  />
                </Field>
              </div>
              <Field label="CNPJ">
                <input
                  type="text"
                  placeholder="00.000.000/0000-00"
                  value={form.cnpj}
                  onChange={(e) => set('cnpj', e.target.value)}
                  className={fieldClass('cnpj')}
                />
              </Field>
              <Field label="Tipo de empresa">
                <input
                  type="text"
                  placeholder="Ex: Supermercado, Farmácia, Padaria..."
                  value={form.tipo_empresa}
                  onChange={(e) => set('tipo_empresa', e.target.value)}
                  className={fieldClass('tipo_empresa')}
                />
              </Field>
            </div>
          </Card>

          <Card className="p-6">
            <SectionTitle icon={<Mail size={18} />} title="Contato" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Email *">
                  <input
                    type="email"
                    placeholder="contato@empresa.com"
                    value={form['e-mail']}
                    onChange={(e) => set('e-mail', e.target.value)}
                    className={fieldClass('e-mail')}
                  />
                  {errors['e-mail'] && <p className="mt-1 text-xs text-coral">{errors['e-mail']}</p>}
                </Field>
              </div>
              <Field label="Telefone">
                <input
                  type="text"
                  placeholder="(00) 0000-0000"
                  value={form.telefone}
                  onChange={(e) => set('telefone', e.target.value)}
                  className={fieldClass('telefone')}
                />
              </Field>
              <Field label="Celular / WhatsApp">
                <input
                  type="text"
                  placeholder="(00) 00000-0000"
                  value={form.celular}
                  onChange={(e) => set('celular', e.target.value)}
                  className={fieldClass('celular')}
                />
              </Field>
            </div>
          </Card>

          <Card className="p-6">
            <SectionTitle icon={<MapPin size={18} />} title="Endereço" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Endereço">
                  <input
                    type="text"
                    placeholder="Rua, número, bairro"
                    value={form.endereco}
                    onChange={(e) => set('endereco', e.target.value)}
                    className={fieldClass('endereco')}
                  />
                </Field>
              </div>
              <Field label="Cidade">
                <input
                  type="text"
                  placeholder="Nome da cidade"
                  value={form.cidade}
                  onChange={(e) => set('cidade', e.target.value)}
                  className={fieldClass('cidade')}
                />
              </Field>
              <Field label="Estado">
                <select
                  value={form.estado}
                  onChange={(e) => set('estado', e.target.value)}
                  className={`${inputClass} cursor-pointer border-transparent`}
                >
                  <option value="">Selecione o estado</option>
                  {estados.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </Field>
            </div>
          </Card>

          <Card className="p-6">
            <SectionTitle icon={<Lock size={18} />} title="Acesso ao Sistema" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Programa / Plano">
                <input
                  type="text"
                  placeholder="Ex: IMPULSO, BÁSICO..."
                  value={form.programa}
                  onChange={(e) => set('programa', e.target.value)}
                  className={fieldClass('programa')}
                />
              </Field>
              <Field label="Senha de acesso *">
                <input
                  type="text"
                  placeholder="Senha para login do cliente"
                  value={form.senha}
                  onChange={(e) => set('senha', e.target.value)}
                  className={fieldClass('senha')}
                />
                {errors.senha && <p className="mt-1 text-xs text-coral">{errors.senha}</p>}
              </Field>
              <div className="sm:col-span-2">
                <Field label="Tipo de cliente">
                  <div className="flex gap-2">
                    {([
                      { value: 'pagante', label: 'Pagante' },
                      { value: 'programa', label: 'Programa' },
                    ] as const).map(opt => {
                      const active = form.origem === opt.value
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => set('origem', opt.value)}
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
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <SectionTitle icon={<CalendarX size={18} />} title="Data de Saída do App" />
            <Field label="Data de saída (opcional)">
              <input
                type="date"
                value={form.data_saida}
                onChange={(e) => set('data_saida', e.target.value)}
                className={fieldClass('data_saida')}
              />
              <p className="mt-1.5 text-xs text-ink-faint">
                Preencha apenas se o cliente encerrou o uso do app
              </p>
            </Field>
          </Card>

          <Card className="p-6">
            <SectionTitle icon={<CheckSquare size={18} />} title="Configurações" />
            <div className="flex flex-col gap-3">
              {[
                { field: 'ativo', label: 'Cadastro ativo', desc: 'O cliente poderá acessar o sistema' },
                { field: 'auditor_atribui_acao', label: 'Auditor atribui ação no checklist', desc: 'Permite que o auditor defina responsáveis por ações corretivas' },
              ].map(({ field, label, desc }) => (
                <label
                  key={field}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl px-4 py-3.5 transition-colors ${
                    form[field as keyof typeof form] ? 'bg-teal-tint' : 'bg-surface-2'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form[field as keyof typeof form] as boolean}
                    onChange={(e) => set(field, e.target.checked)}
                    className="mt-0.5 h-4.5 w-4.5 cursor-pointer accent-teal"
                  />
                  <div>
                    <p className="text-sm font-semibold text-ink">{label}</p>
                    <p className="text-xs text-ink-muted">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </Card>

          <div className="flex justify-end gap-3 pb-4">
            <Button variant="secondary" onClick={() => router.push('/organizacao/grupos-empresa')}>
              Cancelar
            </Button>
            <Button variant="primary" icon={<Save size={16} />} onClick={salvar} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar cadastro'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
