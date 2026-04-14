import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

const BASE_URL = process.env.BOMCONTROLE_API_URL!
const API_KEY  = process.env.BOMCONTROLE_API_KEY!
const ID_EMPRESA  = Number(process.env.BOMCONTROLE_ID_EMPRESA)
const ID_SERVICO  = Number(process.env.BOMCONTROLE_ID_SERVICO)

const planoValores: Record<string, { valor: number; nome: string }> = {
  starter:    { valor: 250.00,  nome: 'Starter' },
  growth:     { valor: 159.99,  nome: 'Growth' },
  scale:      { valor: 139.99,  nome: 'Scale' },
  enterprise: { valor: 129.99,  nome: 'Enterprise' },
}

function headers() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `ApiKey ${API_KEY}`,
  }
}

async function bomcontrole(path: string, method: string, body?: object) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  })
  if (res.status === 204) return null
  const text = await res.text()
  logger.error('bomcontrole/raw', `${method} ${path} → ${res.status}: ${text}`)
  try { return JSON.parse(text) } catch { return text }
}

export async function POST(request: NextRequest) {
  try {
    const { nome, email, telefone, cnpj, nomeEmpresa, plano } = await request.json()

    if (!nome || !email || !telefone || !plano) {
      return NextResponse.json({ error: 'Dados obrigatórios ausentes.' }, { status: 400 })
    }

    const planoInfo = planoValores[plano] ?? planoValores.growth

    // 1. Criar cliente no BomControle
    // Sempre como PessoaFisica — BomControle valida CNPJ estritamente e o campo é opcional no formulário
    const clienteBody = {
      PessoaFisica: { Nome: nomeEmpresa || nome, Documento: '' },
      PessoaJuridica: null,
      Contatos: [
        { Nome: nome, Email: email, Telefone: telefone.replace(/\D/g, ''), Padrao: true, Cobranca: true },
      ],
    }

    const cliente = await bomcontrole('/Cliente/Criar', 'POST', clienteBody)

    // A API retorna o Id diretamente como número inteiro
    const idCliente = typeof cliente === 'number' ? cliente : (cliente?.Id ?? cliente?.id)

    if (!idCliente) {
      logger.error('bomcontrole/criar-venda', `Erro ao criar cliente: ${JSON.stringify(cliente)}`)
      return NextResponse.json({ error: 'Erro ao cadastrar cliente no BomControle.' }, { status: 400 })
    }

    // 2. Criar venda no BomControle
    const hoje = new Date()
    const amanha = new Date(hoje)
    amanha.setDate(amanha.getDate() + 1)

    function toBC(d: Date) {
      return d.toISOString().slice(0, 10) + ' 00:00:00'
    }

    const venda = await bomcontrole('/Venda/Criar', 'POST', {
      IdCliente: idCliente,
      IdEmpresa: ID_EMPRESA,
      FormaPagamento: { Boleto: { Observacao: null } },
      Servicos: [
        {
          IdServico: ID_SERVICO,
          Quantidade: 1,
          ValorUnitario: planoInfo.valor,
          ValorDesconto: 0,
        },
      ],
      PrimeiroVencimento: toBC(amanha),
      Data: toBC(hoje),
      QuatidadeParcelas: 1,
      Observacao: `Performe seu Mercado - Plano ${planoInfo.nome}`,
    })

    if (!venda || !venda.IdVenda) {
      logger.error('bomcontrole/criar-venda', `Erro ao criar venda: ${JSON.stringify(venda)}`)
      return NextResponse.json({ error: 'Erro ao registrar venda no BomControle.' }, { status: 400 })
    }

    return NextResponse.json({ ok: true, idVenda: venda.IdVenda, idFatura: venda.IdFatura })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    logger.error('bomcontrole/criar-venda', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
