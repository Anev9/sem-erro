import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function inicioPeriodo(recorrencia: string | null): string | null {
  const BRAZIL_OFFSET_MS = 3 * 60 * 60 * 1000
  const agora = new Date()
  const local = new Date(agora.getTime() - BRAZIL_OFFSET_MS)

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

export async function POST(request: NextRequest) {
  try {
    const { checklist_futuro_id, colaborador_id, item_id, resposta, observacao, foto_url } = await request.json()

    if (!checklist_futuro_id || !colaborador_id || !item_id || !resposta) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    const supabase = db()

    // Busca a recorrência do checklist para filtrar respostas pelo período atual
    const { data: checklist } = await supabase
      .from('checklists_futuros')
      .select('recorrencia')
      .eq('id', checklist_futuro_id)
      .single()

    const periodoInicio = inicioPeriodo(checklist?.recorrencia ?? null)

    // Para checklists recorrentes, só considera resposta existente se for do período atual.
    // Isso garante que um novo período (dia/semana/mês) sempre gera um INSERT com created_at atualizado,
    // em vez de fazer UPDATE na resposta antiga (que ficaria com o created_at do período anterior).
    let queryExistente = supabase
      .from('checklist_respostas')
      .select('id')
      .eq('checklist_futuro_id', checklist_futuro_id)
      .eq('colaborador_id', colaborador_id)
      .eq('item_id', item_id)

    if (periodoInicio) {
      queryExistente = queryExistente.gte('created_at', periodoInicio)
    }

    const { data: existente } = await queryExistente.maybeSingle()

    if (existente) {
      const { error } = await supabase
        .from('checklist_respostas')
        .update({ resposta, observacao, ...(foto_url != null && { foto_url }) })
        .eq('id', existente.id)
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('checklist_respostas')
        .insert({
          checklist_futuro_id,
          colaborador_id,
          item_id,
          resposta,
          observacao,
          ...(foto_url != null && { foto_url }),
        })
      if (error) throw error
    }

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    logger.error('colaborador/resposta', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
