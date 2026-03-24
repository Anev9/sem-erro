import { NextRequest, NextResponse } from 'next/server'

const ASAAS_URL = process.env.ASAAS_API_URL || 'https://api.asaas.com/api/v3'
const ASAAS_KEY = process.env.ASAAS_API_KEY!

const planoValores: Record<string, { valor: number; nome: string }> = {
  starter:    { valor: 250.00,  nome: 'Starter' },
  growth:     { valor: 159.99,  nome: 'Growth' },
  scale:      { valor: 139.99,  nome: 'Scale' },
  enterprise: { valor: 129.99,  nome: 'Enterprise' },
}

async function asaas(path: string, method: string, body?: object) {
  const res = await fetch(`${ASAAS_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'access_token': ASAAS_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  return res.json()
}

export async function POST(request: NextRequest) {
  try {
    const { nome, email, telefone, cnpj, nomeEmpresa, plano } = await request.json()

    if (!nome || !email || !telefone) {
      return NextResponse.json({ error: 'Nome, email e telefone são obrigatórios' }, { status: 400 })
    }

    const planoInfo = planoValores[plano] || planoValores.growth

    // 1. Criar cliente no ASAAS
    const clientePayload: Record<string, string> = {
      name: nome,
      email,
      phone: telefone.replace(/\D/g, ''),
    }
    if (nomeEmpresa) clientePayload.company = nomeEmpresa
    if (cnpj) clientePayload.cpfCnpj = cnpj.replace(/\D/g, '')

    const cliente = await asaas('/customers', 'POST', clientePayload)

    if (cliente.errors?.length) {
      return NextResponse.json({ error: cliente.errors[0]?.description || 'Erro ao criar cliente no ASAAS' }, { status: 400 })
    }

    // 2. Criar assinatura mensal
    const proxVencimento = new Date()
    proxVencimento.setDate(proxVencimento.getDate() + 1)
    const nextDueDate = proxVencimento.toISOString().split('T')[0]

    const assinatura = await asaas('/subscriptions', 'POST', {
      customer: cliente.id,
      billingType: 'UNDEFINED', // cliente escolhe o método de pagamento
      value: planoInfo.valor,
      nextDueDate,
      cycle: 'MONTHLY',
      description: `Performe seu Mercado - Plano ${planoInfo.nome}`,
    })

    if (assinatura.errors?.length) {
      return NextResponse.json({ error: assinatura.errors[0]?.description || 'Erro ao criar assinatura no ASAAS' }, { status: 400 })
    }

    // 3. Buscar a primeira cobrança para pegar o link de pagamento
    const pagamentos = await asaas(`/subscriptions/${assinatura.id}/payments`, 'GET')
    const primeiroPagamento = pagamentos.data?.[0]

    return NextResponse.json({
      ok: true,
      assinaturaId: assinatura.id,
      invoiceUrl: primeiroPagamento?.invoiceUrl || null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[asaas/criar-assinatura]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
