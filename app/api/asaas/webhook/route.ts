import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

const ASAAS_URL = process.env.ASAAS_API_URL || 'https://api.asaas.com/api/v3'
const ASAAS_KEY = process.env.ASAAS_API_KEY!

const PLANO_POR_VALOR: Record<number, string> = {
  250.00: 'starter',
  159.99: 'growth',
  139.99: 'scale',
  129.99: 'enterprise',
}

function serviceDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function asaas(path: string) {
  const res = await fetch(`${ASAAS_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', 'access_token': ASAAS_KEY },
  })
  return res.json()
}

export async function POST(request: NextRequest) {
  try {
    // Validar token secreto do webhook (configurado no painel Asaas)
    const token = request.headers.get('asaas-access-token')
    if (process.env.ASAAS_WEBHOOK_TOKEN && token !== process.env.ASAAS_WEBHOOK_TOKEN) {
      logger.warn('asaas/webhook', 'Token inválido', { token })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { event, payment } = body

    logger.info('asaas/webhook', 'Evento recebido', { event, paymentId: payment?.id })

    // Só processar pagamentos confirmados
    if (event !== 'PAYMENT_CONFIRMED' && event !== 'PAYMENT_RECEIVED') {
      return NextResponse.json({ ok: true, skipped: true })
    }

    if (!payment?.subscription) {
      // Cobrança avulsa, não é assinatura — ignorar
      return NextResponse.json({ ok: true, skipped: true })
    }

    // Buscar dados da assinatura para pegar o customer e valor
    const assinatura = await asaas(`/subscriptions/${payment.subscription}`)
    if (!assinatura?.customer) {
      logger.warn('asaas/webhook', 'Assinatura sem customer', { subscriptionId: payment.subscription })
      return NextResponse.json({ ok: true, skipped: true })
    }

    // Buscar dados do cliente no Asaas
    const cliente = await asaas(`/customers/${assinatura.customer}`)
    if (!cliente?.email) {
      logger.error('asaas/webhook', 'Cliente sem e-mail', { customerId: assinatura.customer })
      return NextResponse.json({ ok: true, skipped: true })
    }

    const email = cliente.email.toLowerCase().trim()
    const nome = cliente.name || email
    const plano = PLANO_POR_VALOR[assinatura.value] ?? 'growth'
    const supabase = serviceDb()

    // Verificar se o aluno já existe (para não duplicar)
    const { data: existente } = await supabase
      .from('alunos')
      .select('id')
      .eq('e-mail', email)
      .maybeSingle()

    if (existente) {
      logger.info('asaas/webhook', 'Aluno já existe, ignorando', { email })
      return NextResponse.json({ ok: true, skipped: true })
    }

    // Criar aluno na tabela alunos (sem senha — ele vai definir pelo link do Supabase)
    const { data: novoAluno, error: insertError } = await supabase
      .from('alunos')
      .insert({
        'e-mail': email,
        clientes: nome,
        senha: '',
        tipo: 'aluno',
        ativo: true,
        programa: plano,
      })
      .select('id')
      .single()

    if (insertError || !novoAluno) {
      logger.error('asaas/webhook', 'Erro ao criar aluno', insertError)
      return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 })
    }

    logger.info('asaas/webhook', 'Aluno criado', { alunoId: novoAluno.id, email, plano })

    // Convidar usuário pelo Supabase Auth — ele envia o e-mail com link para definir senha
    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: { aluno_id: novoAluno.id, role: 'aluno', plano },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
    })

    if (inviteError) {
      logger.error('asaas/webhook', 'Erro ao enviar convite Supabase', inviteError.message)
      // Não falhar — o aluno já foi criado, admin pode reenviar depois
    } else {
      // Salvar o auth_id no registro do aluno
      const { data: { users } } = await supabase.auth.admin.listUsers()
      const authUser = users.find(u => u.email?.toLowerCase() === email)
      if (authUser) {
        await supabase.from('alunos').update({ auth_id: authUser.id }).eq('id', novoAluno.id)
      }

      logger.info('asaas/webhook', 'Convite enviado pelo Supabase', { email })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    logger.error('asaas/webhook', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
