import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function isAdmin(request: NextRequest): boolean {
  return !!request.cookies.get('sem-erro-admin')?.value
}

async function enviarEmailResend(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { ok: false, erro: 'RESEND_API_KEY não configurada' }

  const from = process.env.EMAIL_FROM || 'Performe seu Mercado <noreply@performeseumercado.com.br>'

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, html }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return { ok: false, erro: JSON.stringify(err) }
  }
  return { ok: true }
}

export async function POST(request: NextRequest) {
  const isCron = request.headers.get('x-cron-secret') === process.env.CRON_SECRET && !!process.env.CRON_SECRET
  if (!isCron && !isAdmin(request)) {
    return NextResponse.json({ error: 'Acesso restrito' }, { status: 403 })
  }

  const supabase = db()

  // Buscar alunos ativos com e-mail
  const { data: alunos } = await supabase
    .from('alunos')
    .select('id, clientes, "e-mail", ativo')
    .eq('ativo', true)
    .neq('tipo', 'admin')

  if (!alunos || alunos.length === 0) {
    return NextResponse.json({ enviados: 0, erros: 0, semEmail: 0 })
  }

  // Buscar empresas para mapear aluno → empresa
  const { data: empresas } = await supabase
    .from('empresas')
    .select('id, aluno_id')

  const empresaIdsPorAluno: Record<string, string[]> = {}
  for (const emp of empresas || []) {
    const aid = String(emp.aluno_id)
    if (!empresaIdsPorAluno[aid]) empresaIdsPorAluno[aid] = []
    empresaIdsPorAluno[aid].push(emp.id)
  }

  // Buscar ações atrasadas
  const { data: acoesAtrasadas } = await supabase
    .from('acoes_corretivas')
    .select('empresa_id, titulo')
    .eq('status', 'atrasada')

  // Buscar atividade dos últimos 30 dias
  const ha30 = new Date()
  ha30.setDate(ha30.getDate() - 30)
  const { data: atividadeRecente } = await supabase
    .from('acoes_corretivas')
    .select('empresa_id')
    .gte('created_at', ha30.toISOString())

  const empComAtividade = new Set((atividadeRecente || []).map(a => a.empresa_id))

  const atrasadasPorEmpresa: Record<string, string[]> = {}
  for (const ac of acoesAtrasadas || []) {
    if (!atrasadasPorEmpresa[ac.empresa_id]) atrasadasPorEmpresa[ac.empresa_id] = []
    atrasadasPorEmpresa[ac.empresa_id].push(ac.titulo)
  }

  let enviados = 0
  let erros = 0
  let semEmail = 0
  const semResend = !process.env.RESEND_API_KEY

  for (const aluno of alunos) {
    const email = aluno['e-mail']
    if (!email) { semEmail++; continue }

    const empIds = empresaIdsPorAluno[String(aluno.id)] || []
    const acAtrasadas = empIds.flatMap(id => atrasadasPorEmpresa[id] || [])
    const temAtividade = empIds.some(id => empComAtividade.has(id))

    const alertas: string[] = []
    if (acAtrasadas.length > 0) {
      alertas.push(`<li>🔴 <strong>${acAtrasadas.length} ação${acAtrasadas.length > 1 ? 'ões' : ''} atrasada${acAtrasadas.length > 1 ? 's' : ''}</strong>: ${acAtrasadas.slice(0, 3).join(', ')}${acAtrasadas.length > 3 ? '...' : ''}</li>`)
    }
    if (!temAtividade && empIds.length > 0) {
      alertas.push(`<li>⚠️ Sem atividade nos últimos 30 dias. Acesse o sistema para atualizar seus checklists.</li>`)
    }

    if (alertas.length === 0) continue

    const nome = aluno.clientes || email
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #334155; padding: 1.5rem; border-radius: 0.5rem 0.5rem 0 0;">
          <h1 style="color: white; margin: 0; font-size: 1.25rem;">Performe seu Mercado</h1>
          <p style="color: #cbd5e1; margin: 0.25rem 0 0; font-size: 0.875rem;">Alerta do sistema</p>
        </div>
        <div style="background: white; padding: 1.5rem; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 0.5rem 0.5rem;">
          <p style="color: #1f2937;">Olá, <strong>${nome}</strong>!</p>
          <p style="color: #374151;">Identificamos os seguintes pontos de atenção na sua conta:</p>
          <ul style="color: #374151; padding-left: 1.25rem; line-height: 1.8;">
            ${alertas.join('')}
          </ul>
          <div style="margin-top: 1.5rem; text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://performeseumercado.com.br'}/dashboard-aluno"
               style="background: #3b82f6; color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; display: inline-block;">
              Acessar o sistema →
            </a>
          </div>
          <p style="color: #9ca3af; font-size: 0.75rem; margin-top: 1.5rem; text-align: center;">
            Este e-mail foi enviado automaticamente pelo Performe seu Mercado.
          </p>
        </div>
      </div>
    `

    if (semResend) {
      // Sem Resend configurado: simula envio (apenas conta)
      enviados++
    } else {
      const resultado = await enviarEmailResend(email, `⚠️ Alertas pendentes — Performe seu Mercado`, html)
      if (resultado.ok) enviados++
      else erros++
    }
  }

  return NextResponse.json({
    enviados,
    erros,
    semEmail,
    simulado: semResend,
    mensagem: semResend
      ? `Simulação: ${enviados} e-mail(s) seriam enviados. Configure RESEND_API_KEY para envio real.`
      : `${enviados} e-mail(s) enviado(s) com sucesso.`,
  })
}
