'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Building2, User, Mail, Phone, MapPin, Lock, Tag, CheckSquare } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const estados = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
  'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
  'RS','RO','RR','SC','SP','SE','TO'
]

const inputStyle = {
  width: '100%',
  padding: '0.75rem 1rem',
  border: '1px solid #d1d5db',
  borderRadius: '0.5rem',
  fontSize: '0.95rem',
  outline: 'none',
  boxSizing: 'border-box' as const,
  transition: 'border-color 0.2s',
  backgroundColor: 'white',
}

const labelStyle = {
  display: 'block',
  marginBottom: '0.4rem',
  fontWeight: '500' as const,
  color: '#374151',
  fontSize: '0.875rem',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '2px solid #f3f4f6' }}>
      {icon}
      <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#111827', margin: 0 }}>{title}</h2>
    </div>
  )
}

export default function CriarEmpresaPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    clientes: '',
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
      const { error } = await supabase.from('alunos').insert([form])
      if (error) throw error
      router.push('/organizacao/grupos-empresa')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar'
      alert('Erro: ' + msg)
    } finally {
      setSaving(false)
    }
  }

  function inputProps(field: string) {
    return {
      style: { ...inputStyle, borderColor: errors[field] ? '#ef4444' : '#d1d5db' },
      onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        e.currentTarget.style.borderColor = errors[field] ? '#ef4444' : '#3b82f6'
        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'
      },
      onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        e.currentTarget.style.borderColor = errors[field] ? '#ef4444' : '#d1d5db'
        e.currentTarget.style.boxShadow = 'none'
      },
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        <button
          onClick={() => router.push('/organizacao/grupos-empresa')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1rem', backgroundColor: 'white',
            border: '1px solid #e5e7eb', borderRadius: '0.5rem',
            cursor: 'pointer', marginBottom: '1.5rem', color: '#374151', fontSize: '0.9rem'
          }}
        >
          <ArrowLeft size={16} /> Voltar
        </button>

        {/* Page header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#111827', margin: '0 0 0.25rem' }}>
            Novo Grupo de Empresa
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>
            Preencha os dados abaixo para cadastrar um novo cliente
          </p>
        </div>

        <div style={{ display: 'grid', gap: '1.25rem' }}>

          {/* Dados principais */}
          <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
            <SectionTitle icon={<Building2 size={18} style={{ color: '#3b82f6' }} />} title="Dados da Empresa" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <Field label="Nome da empresa *">
                  <input
                    type="text"
                    placeholder="Ex: Supermercado Silva Ltda"
                    value={form.clientes}
                    onChange={(e) => set('clientes', e.target.value)}
                    {...inputProps('clientes')}
                  />
                  {errors.clientes && <p style={{ color: '#ef4444', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>{errors.clientes}</p>}
                </Field>
              </div>
              <Field label="CNPJ">
                <input
                  type="text"
                  placeholder="00.000.000/0000-00"
                  value={form.cnpj}
                  onChange={(e) => set('cnpj', e.target.value)}
                  {...inputProps('cnpj')}
                />
              </Field>
              <Field label="Tipo de empresa">
                <input
                  type="text"
                  placeholder="Ex: Supermercado, Farmácia, Padaria..."
                  value={form.tipo_empresa}
                  onChange={(e) => set('tipo_empresa', e.target.value)}
                  {...inputProps('tipo_empresa')}
                />
              </Field>
            </div>
          </div>

          {/* Contato */}
          <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
            <SectionTitle icon={<Mail size={18} style={{ color: '#10b981' }} />} title="Contato" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <Field label="Email *">
                  <input
                    type="email"
                    placeholder="contato@empresa.com"
                    value={form['e-mail']}
                    onChange={(e) => set('e-mail', e.target.value)}
                    {...inputProps('e-mail')}
                  />
                  {errors['e-mail'] && <p style={{ color: '#ef4444', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>{errors['e-mail']}</p>}
                </Field>
              </div>
              <Field label="Telefone">
                <input
                  type="text"
                  placeholder="(00) 0000-0000"
                  value={form.telefone}
                  onChange={(e) => set('telefone', e.target.value)}
                  {...inputProps('telefone')}
                />
              </Field>
              <Field label="Celular / WhatsApp">
                <input
                  type="text"
                  placeholder="(00) 00000-0000"
                  value={form.celular}
                  onChange={(e) => set('celular', e.target.value)}
                  {...inputProps('celular')}
                />
              </Field>
            </div>
          </div>

          {/* Endereço */}
          <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
            <SectionTitle icon={<MapPin size={18} style={{ color: '#f59e0b' }} />} title="Endereço" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <Field label="Endereço">
                  <input
                    type="text"
                    placeholder="Rua, número, bairro"
                    value={form.endereco}
                    onChange={(e) => set('endereco', e.target.value)}
                    {...inputProps('endereco')}
                  />
                </Field>
              </div>
              <Field label="Cidade">
                <input
                  type="text"
                  placeholder="Nome da cidade"
                  value={form.cidade}
                  onChange={(e) => set('cidade', e.target.value)}
                  {...inputProps('cidade')}
                />
              </Field>
              <Field label="Estado">
                <select
                  value={form.estado}
                  onChange={(e) => set('estado', e.target.value)}
                  style={{ ...inputStyle, borderColor: '#d1d5db', cursor: 'pointer' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <option value="">Selecione o estado</option>
                  {estados.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </Field>
            </div>
          </div>

          {/* Acesso */}
          <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
            <SectionTitle icon={<Lock size={18} style={{ color: '#8b5cf6' }} />} title="Acesso ao Sistema" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Field label="Programa / Plano">
                <input
                  type="text"
                  placeholder="Ex: IMPULSO, BÁSICO..."
                  value={form.programa}
                  onChange={(e) => set('programa', e.target.value)}
                  {...inputProps('programa')}
                />
              </Field>
              <Field label="Senha de acesso *">
                <input
                  type="text"
                  placeholder="Senha para login do cliente"
                  value={form.senha}
                  onChange={(e) => set('senha', e.target.value)}
                  {...inputProps('senha')}
                />
                {errors.senha && <p style={{ color: '#ef4444', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>{errors.senha}</p>}
              </Field>
            </div>
          </div>

          {/* Configurações */}
          <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
            <SectionTitle icon={<CheckSquare size={18} style={{ color: '#ef4444' }} />} title="Configurações" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { field: 'ativo', label: 'Cadastro ativo', desc: 'O cliente poderá acessar o sistema' },
                { field: 'auditor_atribui_acao', label: 'Auditor atribui ação no checklist', desc: 'Permite que o auditor defina responsáveis por ações corretivas' },
              ].map(({ field, label, desc }) => (
                <label key={field} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                  cursor: 'pointer', padding: '0.875rem 1rem',
                  border: '1px solid #e5e7eb', borderRadius: '0.5rem',
                  backgroundColor: form[field as keyof typeof form] ? '#f0fdf4' : '#fafafa',
                  transition: 'all 0.2s'
                }}>
                  <input
                    type="checkbox"
                    checked={form[field as keyof typeof form] as boolean}
                    onChange={(e) => set(field, e.target.checked)}
                    style={{ width: '1.125rem', height: '1.125rem', marginTop: '0.1rem', cursor: 'pointer', accentColor: '#10b981' }}
                  />
                  <div>
                    <p style={{ fontWeight: '600', color: '#111827', margin: '0 0 0.15rem', fontSize: '0.9rem' }}>{label}</p>
                    <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: 0 }}>{desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Botões */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingBottom: '1rem' }}>
            <button
              onClick={() => router.push('/organizacao/grupos-empresa')}
              style={{
                padding: '0.75rem 2rem', border: '1px solid #d1d5db',
                borderRadius: '0.5rem', cursor: 'pointer',
                fontSize: '0.95rem', fontWeight: '500',
                backgroundColor: 'white', color: '#374151'
              }}
            >
              Cancelar
            </button>
            <button
              onClick={salvar}
              disabled={saving}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.75rem 2rem', backgroundColor: saving ? '#9ca3af' : '#10b981',
                color: 'white', border: 'none', borderRadius: '0.5rem',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: '700', fontSize: '0.95rem'
              }}
            >
              <Save size={16} />
              {saving ? 'Salvando...' : 'Salvar cadastro'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
