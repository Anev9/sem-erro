import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

const BASE_URL    = process.env.BOMCONTROLE_API_URL!
const API_KEY     = process.env.BOMCONTROLE_API_KEY!
const ID_EMPRESA  = Number(process.env.BOMCONTROLE_ID_EMPRESA)
const ID_SERVICO  = Number(process.env.BOMCONTROLE_ID_SERVICO)

const ASAAS_API_URL = process.env.ASAAS_API_URL ?? 'https://api.asaas.com/api/v3'
const ASAAS_API_KEY = process.env.ASAAS_API_KEY!

const planoValores: Record<string, { valor: number; nome: string }> = {
  starter:    { valor: 250.00, nome: 'Starter' },
  growth:     { valor: 159.99, nome: 'Growth' },
  scale:      { valor: 139.99, nome: 'Scale' },
  enterprise: { valor: 129.99, nome: 'Enterprise' },
}

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function bcHeaders() {
  return { 'Content-Type': 'application/json', 'Authorization': `ApiKey ${API_KEY}` }
}

async function bomcontrole(path: string, method: string, body?: object) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: bcHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  })
  if (res.status === 204) return null
  const text = await res.text()
  logger.error('bomcontrole/raw', `${method} ${path} → ${res.status}: ${text}`)
  try { return JSON.parse(text) } catch { return text }
}

async function asaas(path: string, method: string, body?: object) {
  const res = await fetch(`${ASAAS_API_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'access_token': ASAAS_API_KEY },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  try { return { ok: res.ok, status: res.status, data: JSON.parse(text) } }
  catch { return { ok: res.ok, status: res.status, data: text } }
}

export async function POST(request: NextRequest) {
  try {
    const { nome, email, telefone, cnpj, nomeEmpresa, plano } = await request.json()

    if (!nome || !email || !telefone || !plano) {
      return NextResponse.json({ error: 'Dados obrigatórios ausentes.' }, { status: 400 })
    }

    const planoInfo = planoValores[plano] ?? planoValores.growth

    // 1. Criar cliente no BomControle
    const cliente = await bomcontrole('/Cliente/Criar', 'POST', {
      PessoaFisica: { Nome: nomeEmpresa || nome, Documento: '' },
      PessoaJuridica: null,
      Contatos: [
        { Nome: nome, Email: email, Telefone: telefone.replace(/\D/g, ''), Padrao: true, Cobranca: true },
      ],
    })

    const idCliente = typeof cliente === 'number' ? cliente : (cliente?.Id ?? cliente?.id)
    if (!idCliente) {
      logger.error('bomcontrole/criar-venda', `Erro ao criar cliente: ${JSON.stringify(cliente)}`)
      return NextResponse.json({ error: 'Erro ao cadastrar cliente no BomControle.' }, { status: 400 })
    }

    // 2. Criar venda no BomControle
    const hoje  = new Date()
    const amanha = new Date(hoje)
    amanha.setDate(amanha.getDate() + 1)
    const toBC = (d: Date) => d.toISOString().slice(0, 10) + ' 00:00:00'

    const venda = await bomcontrole('/Venda/Criar', 'POST', {
      IdCliente: idCliente,
      IdEmpresa: ID_EMPRESA,
      FormaPagamento: { Boleto: { Observacao: null } },
      Servicos: [{ IdServico: ID_SERVICO, Quantidade: 1, ValorUnitario: planoInfo.valor, ValorDesconto: 0 }],
      PrimeiroVencimento: toBC(amanha),
      Data: toBC(hoje),
      QuatidadeParcelas: 1,
      Observacao: `Performe seu Mercado - Plano ${planoInfo.nome}`,
    })

    if (!venda?.IdVenda) {
      logger.error('bomcontrole/criar-venda', `Erro ao criar venda: ${JSON.stringify(venda)}`)
      return NextResponse.json({ error: 'Erro ao registrar venda no BomControle.' }, { status: 400 })
    }

    // 3. Criar cliente + cobrança no Asaas
    let asaasUrl: string | null = null
    let asaasPaymentId: string | null = null

    try {
      const clienteAsaas = await asaas('/customers', 'POST', {
        name: nomeEmpresa || nome,
        cpfCnpj: cnpj?.replace(/\D/g, '') || undefined,
        email,
        mobilePhone: telefone.replace(/\D/g, ''),
        notificationDisabled: false,
      })

      const idClienteAsaas = clienteAsaas.data?.id
      if (!idClienteAsaas) {
        logger.error('asaas/criar-cliente', `status=${clienteAsaas.status} key_prefix=${ASAAS_API_KEY?.slice(0,10)} data=${JSON.stringify(clienteAsaas.data)}`)
      } else {
        const cobranca = await asaas('/payments', 'POST', {
          customer: idClienteAsaas,
          billingType: 'UNDEFINED',
          value: planoInfo.valor,
          dueDate: amanha.toISOString().slice(0, 10),
          description: `Performe seu Mercado - Plano ${planoInfo.nome}`,
          externalReference: String(venda.IdVenda),
        })

        asaasPaymentId = cobranca.data?.id ?? null
        asaasUrl       = cobranca.data?.invoiceUrl ?? null

        if (!asaasPaymentId) {
          logger.error('asaas/criar-cobranca', JSON.stringify(cobranca.data))
        }
      }
    } catch (asaasErr) {
      logger.error('asaas/criar-venda', asaasErr instanceof Error ? asaasErr.message : String(asaasErr))
    }

    // Se Asaas não gerou o link, o cliente não consegue pagar — retornar erro
    if (!asaasPaymentId) {
      logger.error('bomcontrole/criar-venda', `Asaas não gerou link de pagamento para venda BomControle ${venda.IdVenda}`)
      return NextResponse.json(
        { error: 'Erro ao gerar link de pagamento. Tente novamente ou entre em contato com o suporte.' },
        { status: 500 }
      )
    }

    // 4. Salvar venda pendente no Supabase (para liberar acesso após pagamento)
    if (asaasPaymentId) {
      const { error: dbErr } = await db()
        .from('vendas_pendentes')
        .insert({
          asaas_payment_id:     asaasPaymentId,
          bomcontrole_venda_id: String(venda.IdVenda),
          nome,
          email:                email.toLowerCase().trim(),
          telefone,
          nome_empresa:         nomeEmpresa || null,
          plano,
        })

      if (dbErr) logger.error('supabase/vendas_pendentes', dbErr.message)
    }

    return NextResponse.json({ ok: true, idVenda: venda.IdVenda, idFatura: venda.IdFatura, asaasUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    logger.error('bomcontrole/criar-venda', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
