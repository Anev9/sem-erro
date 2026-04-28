import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { logger } from '@/lib/logger'

const APP_URL    = process.env.NEXT_PUBLIC_APP_URL ?? 'https://performeseumercado.com.br'
const EMAIL_FROM = process.env.EMAIL_FROM ?? 'Performe seu Mercado <noreply@performeseumercado.com.br>'

const EVENTOS_PAGOS = new Set(['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED'])

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function gerarSenha(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!'
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

async function enviarEmailAcesso(email: string, nome: string, senha: string, plano: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    logger.error('webhook/email', 'RESEND_API_KEY não configurada')
    return
  }

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
      <div style="background: linear-gradient(135deg, #1e3a8a, #1d4ed8); padding: 2rem; border-radius: 0.75rem 0.75rem 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 1.5rem; font-weight: 900;">Performe seu Mercado</h1>
        <p style="color: #bfdbfe; margin: 0.5rem 0 0; font-size: 0.9rem;">Seu acesso está liberado! 🎉</p>
      </div>
      <div style="background: white; padding: 2rem; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 0.75rem 0.75rem;">
        <p>Olá, <strong>${nome}</strong>!</p>
        <p>Seu pagamento foi confirmado e seu acesso ao <strong style="color: #f97316;">Plano ${plano}</strong> foi liberado. 🎊</p>
        <p>Use as credenciais abaixo para entrar no sistema:</p>

        <div style="background: #f8fafc; border: 2px solid #fed7aa; border-radius: 0.5rem; padding: 1.5rem; margin: 1.5rem 0;">
          <p style="margin: 0 0 0.75rem; font-size: 0.95rem;"><strong>🔗 Link de acesso:</strong><br>
            <a href="${APP_URL}/login" style="color: #2563eb;">${APP_URL}/login</a>
          </p>
          <p style="margin: 0 0 0.5rem; font-size: 0.95rem;"><strong>📧 E-mail:</strong> ${email}</p>
          <p style="margin: 0; font-size: 0.95rem;"><strong>🔑 Senha:</strong>
            <span style="font-family: monospace; font-size: 1.1rem; background: #fff7ed; padding: 0.2rem 0.5rem; border-radius: 0.25rem; color: #ea580c; font-weight: 700;">${senha}</span>
          </p>
        </div>

        <div style="text-align: center; margin: 2rem 0;">
          <a href="${APP_URL}/login"
             style="background: #f97316; color: white; padding: 0.875rem 2.5rem; border-radius: 9999px; text-decoration: none; font-weight: 800; font-size: 1rem; display: inline-block; box-shadow: 0 4px 12px rgba(249,115,22,0.4);">
            Acessar o sistema →
          </a>
        </div>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 0.5rem; padding: 1rem; margin-top: 1rem;">
          <p style="margin: 0; font-size: 0.875rem; color: #15803d;">
            🔒 <strong>Dica de segurança:</strong> Após o primeiro acesso, troque sua senha em <strong>Perfil → Alterar Senha</strong>.
          </p>
        </div>

        <p style="color: #9ca3af; font-size: 0.75rem; margin-top: 1.5rem; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 1rem;">
          Dúvidas? Fale conosco: contato@semerro.com.br
        </p>
      </div>
    </div>
  `

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: email,
      subject: '🎉 Seu acesso ao Performe seu Mercado está liberado!',
      html,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    logger.error('webhook/email', JSON.stringify(err))
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validação de token desativada temporariamente para diagnóstico

    const body    = await request.json()
    const event   = body?.event as string
    const payment = body?.payment

    if (!EVENTOS_PAGOS.has(event) || !payment?.id) {
      return NextResponse.json({ ok: true })
    }

    const paymentId = payment.id as string
    const supabase  = db()

    // Buscar venda pendente registrada no momento do formulário
    const { data: venda, error: findErr } = await supabase
      .from('vendas_pendentes')
      .select('*')
      .eq('asaas_payment_id', paymentId)
      .eq('processado', false)
      .maybeSingle()

    if (findErr) {
      logger.error('webhook/buscar-venda', findErr.message)
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }

    if (!venda) {
      // Cobrança não originada pelo formulário — ignorar
      return NextResponse.json({ ok: true })
    }

    // Verificar se usuário já existe (evitar duplicata)
    const { data: existente } = await supabase
      .from('alunos')
      .select('id')
      .eq('e-mail', venda.email)
      .maybeSingle()

    if (!existente) {
      const senha = gerarSenha()
      const hash  = await bcrypt.hash(senha, 12)

      const { error: insertErr } = await supabase
        .from('alunos')
        .insert({
          clientes:          venda.nome_empresa || venda.nome,
          'e-mail':          venda.email,
          senha:             hash,
          programa:          venda.plano,
          ativo:             true,
          tipo:              'aluno',
          senha_temporaria:  true,
        })

      if (insertErr) {
        logger.error('webhook/criar-aluno', insertErr.message)
        return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 })
      }

      await enviarEmailAcesso(venda.email, venda.nome_empresa || venda.nome, senha, venda.plano)
      logger.info('webhook/acesso-liberado', `Acesso liberado para ${venda.email} — plano ${venda.plano}`)
    }

    // Marcar como processado para não duplicar em caso de reentrega
    await supabase
      .from('vendas_pendentes')
      .update({ processado: true })
      .eq('id', venda.id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    logger.error('asaas/webhook', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
