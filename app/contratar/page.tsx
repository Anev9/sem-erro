'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Check, ArrowLeft, Send, Building2, User, Mail, Phone, MapPin, ShoppingBag } from 'lucide-react'


const PLANOS = {
  starter: {
    nome: 'Plano Starter',
    preco: 'R$ 250,00',
    precoOriginal: 'R$ 500,00',
    descricao: 'Ideal para 1 Loja',
    beneficios: ['Todos os recursos incluídos', 'Suporte prioritário', 'Treinamento completo'],
    cor: '#f97316',
    popular: false,
  },
  growth: {
    nome: 'Plano Growth',
    preco: 'R$ 159,99',
    precoOriginal: 'R$ 319,98',
    descricao: '2 a 5 Lojas',
    beneficios: ['Todos os recursos incluídos', 'Suporte prioritário VIP', 'Treinamento completo', 'Economia de 50%'],
    cor: '#f97316',
    popular: true,
  },
  scale: {
    nome: 'Plano Scale',
    preco: 'R$ 139,99',
    precoOriginal: 'R$ 279,98',
    descricao: '6 a 9 Lojas',
    beneficios: ['Todos os recursos incluídos', 'Suporte VIP 24/7', 'Treinamento personalizado'],
    cor: '#f97316',
    popular: false,
  },
  enterprise: {
    nome: 'Plano Enterprise',
    preco: 'R$ 129,99',
    precoOriginal: 'R$ 259,98',
    descricao: '10+ Lojas',
    beneficios: ['Todos os recursos incluídos', 'Suporte VIP 24/7', 'Consultor dedicado'],
    cor: '#f97316',
    popular: false,
  },
}

const estados = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

function ContratarForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const planoKey = (searchParams.get('plano') || 'growth') as keyof typeof PLANOS
  const plano = PLANOS[planoKey] || PLANOS.growth

  const [enviado, setEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erroEnvio, setErroEnvio] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    nomeEmpresa: '',
    nomeResponsavel: '',
    email: '',
    telefone: '',
    whatsapp: '',
    cnpj: '',
    segmento: '',
    cidade: '',
    estado: '',
    quantidadeLojas: '',
    comoConheceu: '',
    mensagem: '',
  })

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => { const e = { ...prev }; delete e[field]; return e })
  }

  function validar() {
    const e: Record<string, string> = {}
    if (!form.nomeEmpresa.trim()) e.nomeEmpresa = 'Obrigatório'
    if (!form.nomeResponsavel.trim()) e.nomeResponsavel = 'Obrigatório'
    if (!form.email.trim()) e.email = 'Obrigatório'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email inválido'
    if (!form.telefone.trim()) e.telefone = 'Obrigatório'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (!validar()) return
    setEnviando(true)
    setErroEnvio('')

    try {
      const res = await fetch('/api/bomcontrole/criar-venda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: form.nomeResponsavel,
          email: form.email,
          telefone: form.telefone,
          cnpj: form.cnpj,
          nomeEmpresa: form.nomeEmpresa,
          plano: planoKey,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.ok) {
        setErroEnvio(data.error || 'Erro ao processar solicitação. Tente novamente.')
        setEnviando(false)
        return
      }

      if (data.pixUrl || data.boletoUrl) {
        sessionStorage.setItem('pix_url',    data.pixUrl    ?? '')
        sessionStorage.setItem('boleto_url', data.boletoUrl ?? '')
        sessionStorage.setItem('plano_nome', plano.nome)
        window.location.href = '/pagar'
        return
      }

      setEnviado(true)
      setEnviando(false)
    } catch {
      setErroEnvio('Erro de conexão. Verifique sua internet e tente novamente.')
      setEnviando(false)
    }
  }

  const inputBase: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem',
    border: '1.5px solid #e5e7eb', borderRadius: '0.5rem',
    fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
    backgroundColor: 'white', transition: 'border-color 0.2s, box-shadow 0.2s',
    fontFamily: 'inherit',
  }

  function inp(field: string): React.InputHTMLAttributes<HTMLInputElement> & React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    return {
      style: { ...inputBase, borderColor: errors[field] ? '#ef4444' : '#e5e7eb' },
      onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        e.currentTarget.style.borderColor = '#f97316'
        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.15)'
      },
      onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        e.currentTarget.style.borderColor = errors[field] ? '#ef4444' : '#e5e7eb'
        e.currentTarget.style.boxShadow = 'none'
      },
    }
  }

  if (enviado) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '1.5rem', padding: '3rem', maxWidth: '500px', width: '100%', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
          <div style={{ width: '5rem', height: '5rem', backgroundColor: '#f0fdf4', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Check size={40} style={{ color: '#16a34a' }} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.75rem' }}>
            Solicitação Enviada!
          </h2>
          <p style={{ color: '#6b7280', fontSize: '1rem', marginBottom: '0.5rem' }}>
            Obrigado, <strong>{form.nomeResponsavel}</strong>!
          </p>
          <p style={{ color: '#6b7280', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: 1.6 }}>
            Recebemos sua solicitação para o <strong style={{ color: '#f97316' }}>{plano.nome}</strong>. Nossa equipe entrará em contato em até 24 horas pelo email ou WhatsApp informado.
          </p>
          <button
            onClick={() => router.push('/')}
            style={{
              padding: '0.875rem 2rem', backgroundColor: '#f97316',
              color: 'white', border: 'none', borderRadius: '0.5rem',
              cursor: 'pointer', fontWeight: '700', fontSize: '1rem', width: '100%'
            }}
          >
            Voltar ao site
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#f97316', padding: '1rem 2rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.25rem', letterSpacing: '0.05em' }}>Performe seu Mercado</span>
          <button
            onClick={() => router.push('/')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'white', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', opacity: 0.9 }}
          >
            <ArrowLeft size={16} /> Voltar ao site
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2rem', alignItems: 'start' }}>

        {/* Formulário */}
        <div>
          <div style={{ marginBottom: '1.75rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#111827', margin: '0 0 0.5rem' }}>
              Preencha seus dados
            </h1>
            <p style={{ color: '#6b7280', margin: 0, fontSize: '0.95rem' }}>
              Nossa equipe entrará em contato para finalizar sua contratação.
            </p>
          </div>

          <form onSubmit={enviar} style={{ display: 'grid', gap: '1.25rem' }}>

            {/* Empresa */}
            <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>
                <Building2 size={18} style={{ color: '#f97316' }} />
                <h2 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827', margin: 0 }}>Dados da Empresa</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: '600', color: '#374151' }}>
                    Nome da empresa *
                  </label>
                  <input type="text" placeholder="Ex: Supermercado Silva" value={form.nomeEmpresa} onChange={(e) => set('nomeEmpresa', e.target.value)} {...inp('nomeEmpresa')} />
                  {errors.nomeEmpresa && <p style={{ color: '#ef4444', fontSize: '0.78rem', margin: '0.2rem 0 0' }}>{errors.nomeEmpresa}</p>}
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: '600', color: '#374151' }}>CNPJ</label>
                  <input type="text" placeholder="00.000.000/0000-00" value={form.cnpj} onChange={(e) => set('cnpj', e.target.value)} {...inp('cnpj')} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: '600', color: '#374151' }}>Segmento</label>
                  <input type="text" placeholder="Ex: Supermercado, Farmácia..." value={form.segmento} onChange={(e) => set('segmento', e.target.value)} {...inp('segmento')} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: '600', color: '#374151' }}>Quantidade de lojas</label>
                  <input type="number" min="1" placeholder="Ex: 3" value={form.quantidadeLojas} onChange={(e) => set('quantidadeLojas', e.target.value)} {...inp('quantidadeLojas')} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: '600', color: '#374151' }}>Cidade</label>
                  <input type="text" placeholder="Nome da cidade" value={form.cidade} onChange={(e) => set('cidade', e.target.value)} {...inp('cidade')} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: '600', color: '#374151' }}>Estado</label>
                  <select value={form.estado} onChange={(e) => set('estado', e.target.value)}
                    style={{ ...inputBase, cursor: 'pointer' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#f97316'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.15)' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    <option value="">Selecione</option>
                    {estados.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Responsável */}
            <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>
                <User size={18} style={{ color: '#f97316' }} />
                <h2 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827', margin: 0 }}>Responsável pelo Contato</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: '600', color: '#374151' }}>Nome completo *</label>
                  <input type="text" placeholder="Seu nome" value={form.nomeResponsavel} onChange={(e) => set('nomeResponsavel', e.target.value)} {...inp('nomeResponsavel')} />
                  {errors.nomeResponsavel && <p style={{ color: '#ef4444', fontSize: '0.78rem', margin: '0.2rem 0 0' }}>{errors.nomeResponsavel}</p>}
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: '600', color: '#374151' }}>Email *</label>
                  <input type="email" placeholder="seu@email.com" value={form.email} onChange={(e) => set('email', e.target.value)} {...inp('email')} />
                  {errors.email && <p style={{ color: '#ef4444', fontSize: '0.78rem', margin: '0.2rem 0 0' }}>{errors.email}</p>}
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: '600', color: '#374151' }}>Telefone *</label>
                  <input type="text" placeholder="(00) 0000-0000" value={form.telefone} onChange={(e) => set('telefone', e.target.value)} {...inp('telefone')} />
                  {errors.telefone && <p style={{ color: '#ef4444', fontSize: '0.78rem', margin: '0.2rem 0 0' }}>{errors.telefone}</p>}
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: '600', color: '#374151' }}>WhatsApp</label>
                  <input type="text" placeholder="(00) 00000-0000" value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} {...inp('whatsapp')} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: '600', color: '#374151' }}>Como nos conheceu?</label>
                  <select value={form.comoConheceu} onChange={(e) => set('comoConheceu', e.target.value)}
                    style={{ ...inputBase, cursor: 'pointer' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#f97316'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.15)' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    <option value="">Selecione</option>
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="google">Google</option>
                    <option value="indicacao">Indicação</option>
                    <option value="youtube">YouTube</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: '600', color: '#374151' }}>Mensagem (opcional)</label>
                  <textarea
                    rows={3}
                    placeholder="Dúvidas, necessidades específicas ou qualquer informação adicional..."
                    value={form.mensagem}
                    onChange={(e) => set('mensagem', e.target.value)}
                    style={{ ...inputBase, resize: 'vertical', minHeight: '80px' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#f97316'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.15)' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none' }}
                  />
                </div>
              </div>
            </div>

            {erroEnvio && (
              <div style={{
                backgroundColor: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: '0.5rem', padding: '0.875rem 1rem',
                color: '#dc2626', fontSize: '0.9rem', fontWeight: '500'
              }}>
                ⚠️ {erroEnvio}
              </div>
            )}

            <button
              type="submit"
              disabled={enviando}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                width: '100%', padding: '1rem',
                backgroundColor: enviando ? '#fdba74' : '#f97316',
                color: 'white', border: 'none', borderRadius: '0.75rem',
                cursor: enviando ? 'not-allowed' : 'pointer',
                fontWeight: '700', fontSize: '1.1rem',
                boxShadow: '0 4px 12px rgba(249,115,22,0.35)',
                transition: 'all 0.2s'
              }}
            >
              <Send size={18} />
              {enviando ? 'Enviando solicitação...' : 'Quero contratar agora'}
            </button>
            <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.8rem', margin: 0 }}>
              Sem compromisso. Nossa equipe entrará em contato para esclarecer tudo.
            </p>
          </form>
        </div>

        {/* Resumo do plano */}
        <div style={{ position: 'sticky', top: '1.5rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', border: '2px solid #fed7aa' }}>
            {plano.popular && (
              <div style={{ backgroundColor: '#f97316', color: 'white', textAlign: 'center', padding: '0.5rem', fontSize: '0.8rem', fontWeight: '700', letterSpacing: '0.05em' }}>
                🏆 MAIS POPULAR
              </div>
            )}
            <div style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', margin: '0 0 0.25rem' }}>{plano.nome}</h3>
              <div style={{ backgroundColor: '#fff7ed', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', marginBottom: '1rem', display: 'inline-block' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#9a3412' }}>✨ {plano.descricao}</span>
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <p style={{ color: '#9ca3af', textDecoration: 'line-through', margin: '0 0 0.125rem', fontSize: '0.9rem' }}>{plano.precoOriginal}</p>
                <div style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#f97316', lineHeight: 1 }}>{plano.preco}</div>
                <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>por CNPJ/mês</p>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem' }}>
                {plano.beneficios.map((b) => (
                  <li key={b} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem', fontSize: '0.875rem', color: '#374151' }}>
                    <Check size={16} style={{ color: '#22c55e', flexShrink: 0 }} />
                    {b}
                  </li>
                ))}
              </ul>
              <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '1rem' }}>
                <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Check size={14} style={{ color: '#22c55e' }} /> 30 dias de garantia
                </p>
                <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: 0, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Check size={14} style={{ color: '#22c55e' }} /> Suporte completo na implantação
                </p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.75rem', padding: '1rem' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: '600', color: '#15803d', margin: '0 0 0.25rem' }}>✅ Sem burocracia</p>
            <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0 }}>Preencha o formulário e nossa equipe cuidará de tudo. Você começa a usar em até 48h.</p>
          </div>
        </div>

      </div>
    </div>
  )
}

export default function ContratarPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Carregando...</div>}>
      <ContratarForm />
    </Suspense>
  )
}
