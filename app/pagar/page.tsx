'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PagarPage() {
  const router = useRouter()
  const [pixUrl, setPixUrl]       = useState<string | null>(null)
  const [boletoUrl, setBoletoUrl] = useState<string | null>(null)
  const [plano, setPlano]         = useState('')

  useEffect(() => {
    setPixUrl(sessionStorage.getItem('pix_url'))
    setBoletoUrl(sessionStorage.getItem('boleto_url'))
    setPlano(sessionStorage.getItem('plano_nome') || '')
  }, [])

  if (!pixUrl && !boletoUrl) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          <p>Link de pagamento não encontrado.</p>
          <button onClick={() => router.push('/contratar')}
            style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', background: '#f97316', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '600' }}>
            Voltar ao formulário
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#f97316', padding: '1rem 2rem' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.25rem', letterSpacing: '0.05em' }}>
            Performe seu Mercado
          </span>
        </div>
      </div>

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ width: '4rem', height: '4rem', background: '#f0fdf4', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.75rem' }}>
            ✅
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#111827', margin: '0 0 0.5rem' }}>
            Quase lá! Escolha como pagar
          </h1>
          {plano && (
            <p style={{ color: '#6b7280', margin: 0 }}>
              Plano <strong style={{ color: '#f97316' }}>{plano}</strong> — selecione a forma de pagamento de sua preferência
            </p>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: pixUrl && boletoUrl ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
          {/* PIX */}
          {pixUrl && (
            <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', border: '2px solid #d1fae5', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#065f46', margin: '0 0 0.5rem' }}>PIX</h2>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 0.5rem' }}>Aprovação imediata</p>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 1.5rem' }}>Pague com o app do seu banco, 24h por dia</p>
              <a
                href={pixUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block', padding: '0.875rem',
                  background: '#10b981', color: 'white',
                  borderRadius: '0.625rem', textDecoration: 'none',
                  fontWeight: '700', fontSize: '1rem',
                }}
              >
                Pagar com PIX
              </a>
            </div>
          )}

          {/* Boleto */}
          {boletoUrl && (
            <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', border: '2px solid #dbeafe', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏦</div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1e3a8a', margin: '0 0 0.5rem' }}>Boleto Bancário</h2>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 0.5rem' }}>Aprovação em até 3 dias úteis</p>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 1.5rem' }}>Pague em qualquer banco ou lotérica</p>
              <a
                href={boletoUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block', padding: '0.875rem',
                  background: '#1d4ed8', color: 'white',
                  borderRadius: '0.625rem', textDecoration: 'none',
                  fontWeight: '700', fontSize: '1rem',
                }}
              >
                Gerar Boleto
              </a>
            </div>
          )}
        </div>

        <div style={{ marginTop: '2rem', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '0.75rem', padding: '1rem 1.25rem', fontSize: '0.875rem', color: '#92400e' }}>
          <strong>Após o pagamento:</strong> você receberá um e-mail com seu login e senha para acessar o sistema. Caso tenha dúvidas, entre em contato pelo <strong>contato@semerro.com.br</strong>.
        </div>
      </div>
    </div>
  )
}
