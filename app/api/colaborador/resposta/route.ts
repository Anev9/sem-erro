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

export async function POST(request: NextRequest) {
  try {
    const { checklist_futuro_id, colaborador_id, item_id, resposta, observacao, foto_url } = await request.json()

    if (!checklist_futuro_id || !colaborador_id || !item_id || !resposta) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    const supabase = db()

    const { data: existente } = await supabase
      .from('checklist_respostas')
      .select('id')
      .eq('checklist_futuro_id', checklist_futuro_id)
      .eq('colaborador_id', colaborador_id)
      .eq('item_id', item_id)
      .maybeSingle()

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
