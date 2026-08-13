import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { getColaboradorId } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { inicioPeriodo } from '@/lib/periodo'

const db = createAdminClient

export async function POST(request: NextRequest) {
  try {
    const colaborador_id = getColaboradorId(request)
    if (!colaborador_id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { checklist_futuro_id, item_id, resposta, observacao, foto_url } = await request.json()

    if (!checklist_futuro_id || !item_id || !resposta) {
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
    // Isso garante que um novo período (dia/semana/mês) sempre gera um INSERT com respondido_em atualizado,
    // em vez de fazer UPDATE na resposta antiga (que ficaria com o respondido_em do período anterior).
    let queryExistente = supabase
      .from('checklist_respostas')
      .select('id')
      .eq('checklist_futuro_id', checklist_futuro_id)
      .eq('colaborador_id', colaborador_id)
      .eq('item_id', item_id)

    if (periodoInicio) {
      queryExistente = queryExistente.gte('respondido_em', periodoInicio)
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
