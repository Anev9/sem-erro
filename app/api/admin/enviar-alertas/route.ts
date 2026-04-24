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

function buildEmailHtml(nome: string, alertas: string[], appUrl: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#334155 0%,#1e293b 100%);padding:28px 32px;border-radius:12px 12px 0 0;">
            <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;">Performe seu Mercado</p>
            <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#ffffff;">⚠️ Alertas Pendentes</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:32px;border:1px solid #e2e8f0;border-top:none;">
            <p style="margin:0 0 8px;font-size:16px;color:#1e293b;">Olá, <strong>${nome}</strong>!</p>
            <p style="margin:0 0 24px;font-size:14px;color:#64748b;">
              Identificamos os seguintes pontos de atenção na sua conta que precisam da sua atenção:
            </p>

            <!-- Alertas -->
            <table width="100%" cellpadding="0" cellspacing="0">
              ${alertas.map(a => `
              <tr>
                <td style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:14px 16px;margin-bottom:12px;display:block;">
                  ${a}
                </td>
              </tr>
              <tr><td style="height:10px;"></td></tr>`).join('')}
            </table>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
              <tr>
                <td align="center">
                  <a href="${appUrl}/dashboard-aluno"
                     style="background:#3b82f6;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
                    Acessar o sistema →
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:28px 0 0;font-size:12px;color:#94a3b8;text-align:center;">
              Você está recebendo este e-mail porque possui uma conta ativa no Performe seu Mercado.<br>
              Em caso de dúvidas, entre em contato com seu gestor.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;padding:16px 32px;border-radius:0 0 12px 12px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#94a3b8;">
              © ${new Date().getFullYear()} Performe seu Mercado — Enviado automaticamente pelo sistema de alertas
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function POST(request: NextRequest) {
  const isCron = request.headers.get('x-cron-secret') === process.env.CRON_SECRET && !!process.env.CRON_SECRET
  if (!isCron && !isAdmin(request)) {
    return NextResponse.json({ error: 'Acesso restrito' }, { status: 403 })
  }

  const supabase = db()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://performeseumercado.com.br'

  // Buscar alunos ativos com e-mail
  const { data: alunos } = await supabase
    .from('alunos')
    .select('id, clientes, "e-mail", ativo')
    .eq('ativo', true)
    .neq('tipo', 'admin')

  if (!alunos || alunos.length === 0) {
    return NextResponse.json({ enviados: 0, erros: 0, semEmail: 0, simulado: false })
  }

  // Mapear aluno → empresa(s)
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

  const atrasadasPorEmpresa: Record<string, string[]> = {}
  for (const ac of acoesAtrasadas || []) {
    if (!atrasadasPorEmpresa[ac.empresa_id]) atrasadasPorEmpresa[ac.empresa_id] = []
    atrasadasPorEmpresa[ac.empresa_id].push(ac.titulo)
  }

  // Detectar atividade nos últimos 30 dias:
  // considera ativa se houver ação corretiva OU checklist atualizado
  const ha30 = new Date()
  ha30.setDate(ha30.getDate() - 30)
  const ha30Iso = ha30.toISOString()

  const [{ data: atividadeAcoes }, { data: atividadeChecklists }] = await Promise.all([
    supabase
      .from('acoes_corretivas')
      .select('empresa_id')
      .gte('created_at', ha30Iso),
    supabase
      .from('checklists_futuros')
      .select('empresa_id')
      .gte('updated_at', ha30Iso)
      .not('empresa_id', 'is', null),
  ])

  const empComAtividade = new Set<string>([
    ...(atividadeAcoes || []).map(a => String(a.empresa_id)),
    ...(atividadeChecklists || []).map(c => String(c.empresa_id)).filter(Boolean),
  ])

  // Enviar alertas
  let enviados = 0
  let erros = 0
  let semEmail = 0
  const semResend = !process.env.RESEND_API_KEY
  const errosDetalhe: string[] = []

  for (const aluno of alunos) {
    const email = aluno['e-mail']
    if (!email) { semEmail++; continue }

    const empIds = empresaIdsPorAluno[String(aluno.id)] || []
    if (empIds.length === 0) continue

    const acAtrasadas = empIds.flatMap(id => atrasadasPorEmpresa[id] || [])
    const temAtividade = empIds.some(id => empComAtividade.has(id))

    const alertasHtml: string[] = []

    if (acAtrasadas.length > 0) {
      const lista = acAtrasadas.slice(0, 3).map(t => `"${t}"`).join(', ')
      const sufixo = acAtrasadas.length > 3 ? ` e mais ${acAtrasadas.length - 3}` : ''
      alertasHtml.push(
        `<p style="margin:0;font-size:14px;color:#9a3412;font-weight:700;">🔴 ${acAtrasadas.length} ação${acAtrasadas.length > 1 ? 'ões' : ''} corretiva${acAtrasadas.length > 1 ? 's' : ''} atrasada${acAtrasadas.length > 1 ? 's' : ''}</p>` +
        `<p style="margin:4px 0 0;font-size:13px;color:#7c2d12;">${lista}${sufixo}</p>`
      )
    }

    if (!temAtividade) {
      alertasHtml.push(
        `<p style="margin:0;font-size:14px;color:#9a3412;font-weight:700;">⚠️ Sem atividade nos últimos 30 dias</p>` +
        `<p style="margin:4px 0 0;font-size:13px;color:#7c2d12;">Nenhum checklist ou ação registrada. Acesse o sistema para manter seus dados atualizados.</p>`
      )
    }

    if (alertasHtml.length === 0) continue

    const nome = aluno.clientes || email

    if (semResend) {
      enviados++
    } else {
      const html = buildEmailHtml(nome, alertasHtml, appUrl)
      const resultado = await enviarEmailResend(
        email,
        `⚠️ Alertas pendentes — Performe seu Mercado`,
        html
      )
      if (resultado.ok) {
        enviados++
      } else {
        erros++
        errosDetalhe.push(`${email}: ${resultado.erro}`)
      }
    }
  }

  return NextResponse.json({
    enviados,
    erros,
    semEmail,
    simulado: semResend,
    errosDetalhe: errosDetalhe.length > 0 ? errosDetalhe : undefined,
    mensagem: semResend
      ? `Simulação: ${enviados} e-mail(s) seriam enviados. Configure RESEND_API_KEY para envio real.`
      : erros > 0
        ? `${enviados} e-mail(s) enviado(s) com sucesso. ${erros} falha(s).`
        : `${enviados} e-mail(s) enviado(s) com sucesso.`,
  })
}
