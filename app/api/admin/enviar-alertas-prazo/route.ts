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

// Janela de antecedência (minutos) para disparar o alerta de "prazo próximo"
const MINUTOS_ANTES_ALERTA = 30
const BRAZIL_OFFSET_MS = 3 * 60 * 60 * 1000

// Horário atual e data (YYYY-MM-DD) em America/Sao_Paulo, calculados a partir do UTC do servidor
function horaAtualBrasil() {
  const local = new Date(Date.now() - BRAZIL_OFFSET_MS)
  return {
    minutosAtuais: local.getUTCHours() * 60 + local.getUTCMinutes(),
    dataISO: local.toISOString().slice(0, 10),
  }
}

// Início do período atual (diário/semanal/mensal) em Brasília, usado para saber se o checklist já foi respondido
function inicioPeriodo(recorrencia: string | null): string | null {
  const local = new Date(Date.now() - BRAZIL_OFFSET_MS)
  if (recorrencia === 'diaria') {
    local.setUTCHours(0, 0, 0, 0)
    return new Date(local.getTime() + BRAZIL_OFFSET_MS).toISOString()
  }
  if (recorrencia === 'semanal') {
    local.setUTCDate(local.getUTCDate() - local.getUTCDay())
    local.setUTCHours(0, 0, 0, 0)
    return new Date(local.getTime() + BRAZIL_OFFSET_MS).toISOString()
  }
  if (recorrencia === 'mensal') {
    local.setUTCDate(1)
    local.setUTCHours(0, 0, 0, 0)
    return new Date(local.getTime() + BRAZIL_OFFSET_MS).toISOString()
  }
  return null
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

function buildEmailHtml(checklistNome: string, horaFormatada: string, minutosRestantes: number, appUrl: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <tr>
          <td style="background:linear-gradient(135deg,#b45309 0%,#92400e 100%);padding:28px 32px;border-radius:12px 12px 0 0;">
            <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#fde68a;">Performe seu Mercado</p>
            <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#ffffff;">⏰ Prazo próximo</h1>
          </td>
        </tr>

        <tr>
          <td style="background:#ffffff;padding:32px;border:1px solid #e2e8f0;border-top:none;">
            <p style="margin:0 0 8px;font-size:16px;color:#1e293b;">
              O checklist <strong>${checklistNome}</strong> ainda não foi respondido e o horário limite de hoje é
              <strong>${horaFormatada}</strong>.
            </p>
            <p style="margin:0 0 24px;font-size:14px;color:#64748b;">
              Faltam aproximadamente <strong>${minutosRestantes} minuto(s)</strong> para o prazo.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${appUrl}/dashboard-funcionario"
                     style="background:#f59e0b;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
                    Responder agora →
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:28px 0 0;font-size:12px;color:#94a3b8;text-align:center;">
              Você está recebendo este e-mail porque configurou (ou foi configurado para receber) alertas de prazo neste checklist.
            </p>
          </td>
        </tr>

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
  const { minutosAtuais, dataISO: hojeISO } = horaAtualBrasil()
  const semResend = !process.env.RESEND_API_KEY

  const { data: checklists } = await supabase
    .from('checklists_futuros')
    .select('id, nome, empresa_id, colaborador_id, recorrencia, hora_limite, ultimo_alerta_prazo_enviado_em')
    .eq('ativo', true)
    .not('hora_limite', 'is', null)

  if (!checklists || checklists.length === 0) {
    return NextResponse.json({ enviados: 0, verificados: 0, simulado: semResend })
  }

  let enviados = 0
  let erros = 0

  for (const checklist of checklists) {
    if (checklist.ultimo_alerta_prazo_enviado_em === hojeISO) continue // já alertado hoje

    const [hh, mm] = (checklist.hora_limite as string).split(':').map(Number)
    const minutosLimite = hh * 60 + mm
    const diff = minutosLimite - minutosAtuais
    if (diff < 0 || diff > MINUTOS_ANTES_ALERTA) continue // fora da janela de alerta

    // Já respondido no período atual?
    const periodoInicio = inicioPeriodo(checklist.recorrencia)
    let queryRespostas = supabase
      .from('checklist_respostas')
      .select('*', { count: 'exact', head: true })
      .eq('checklist_futuro_id', checklist.id)
    if (periodoInicio) queryRespostas = queryRespostas.gte('respondido_em', periodoInicio)

    const [{ count: totalItens }, { count: respostasCount }] = await Promise.all([
      supabase.from('checklist_futuro_itens').select('*', { count: 'exact', head: true }).eq('checklist_futuro_id', checklist.id),
      queryRespostas,
    ])
    if ((totalItens || 0) > 0 && (respostasCount || 0) >= (totalItens || 0)) continue // já concluído hoje

    // Destinatários: colaborador responsável (ou toda a empresa) + quem configurou alerta adicional
    const emails = new Set<string>()

    if (checklist.colaborador_id) {
      const { data: colab } = await supabase
        .from('colaboradores')
        .select('email')
        .eq('id', checklist.colaborador_id)
        .eq('ativo', true)
        .single()
      if (colab?.email) emails.add(colab.email)
    } else if (checklist.empresa_id) {
      const { data: colabs } = await supabase
        .from('colaboradores')
        .select('email')
        .eq('empresa_id', checklist.empresa_id)
        .eq('ativo', true)
      colabs?.forEach(c => c.email && emails.add(c.email))
    }

    const { data: adicionais } = await supabase
      .from('alertas_adicionais')
      .select('usuario_id')
      .eq('checklist_futuro_id', checklist.id)
      .eq('notificar_prazo_proximo', true)

    if (adicionais && adicionais.length > 0) {
      const { data: colabsAdicionais } = await supabase
        .from('colaboradores')
        .select('email')
        .in('id', adicionais.map(a => a.usuario_id))
      colabsAdicionais?.forEach(c => c.email && emails.add(c.email))
    }

    if (emails.size === 0) continue

    const horaFormatada = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`

    if (semResend) {
      enviados += emails.size
    } else {
      const html = buildEmailHtml(checklist.nome, horaFormatada, diff, appUrl)
      for (const email of emails) {
        const resultado = await enviarEmailResend(email, `⏰ Prazo próximo: ${checklist.nome} — até ${horaFormatada}`, html)
        if (resultado.ok) enviados++
        else erros++
      }
    }

    await supabase
      .from('checklists_futuros')
      .update({ ultimo_alerta_prazo_enviado_em: hojeISO })
      .eq('id', checklist.id)
  }

  return NextResponse.json({
    enviados,
    erros,
    verificados: checklists.length,
    simulado: semResend,
  })
}
