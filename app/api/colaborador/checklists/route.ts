import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// GET /api/colaborador/checklists?colaborador_id=xxx
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const colaborador_id = searchParams.get('colaborador_id')

  if (!colaborador_id) {
    return NextResponse.json({ error: 'colaborador_id é obrigatório' }, { status: 400 })
  }

  const supabase = db()

  // Buscar empresa do colaborador para incluir checklists da empresa sem colaborador específico
  const { data: colab } = await supabase
    .from('colaboradores')
    .select('empresa_id')
    .eq('id', colaborador_id)
    .single()

  const empresa_id = colab?.empresa_id

  const query = supabase
    .from('checklists_futuros')
    .select(`*, empresas(nome_fantasia)`)
    .eq('ativo', true)
    .order('proxima_execucao', { ascending: false })

  // Checklists atribuídos a este colaborador OU a toda a empresa (colaborador_id nulo)
  const { data: checklists, error } = empresa_id
    ? await query
        .eq('empresa_id', empresa_id)
        .or(`colaborador_id.eq.${colaborador_id},colaborador_id.is.null`)
    : await query.eq('colaborador_id', colaborador_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!checklists || checklists.length === 0) {
    return NextResponse.json([])
  }

  // Calcula o início do período atual ajustado para o Brasil (UTC-3)
  // O servidor roda em UTC; sem ajuste, meia-noite seria 03:00 horário de Brasília
  function inicioPeriodo(recorrencia: string | null): string | null {
    const BRAZIL_OFFSET_MS = 3 * 60 * 60 * 1000 // UTC-3 em milissegundos
    const agora = new Date()
    // Converte para horário local do Brasil
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

  // Buscar contagens para cada checklist
  const checklistsComContagem = await Promise.all(
    checklists.map(async (checklist) => {
      const periodoInicio = inicioPeriodo(checklist.recorrencia ?? null)

      let queryRespostas = supabase
        .from('checklist_respostas')
        .select('*', { count: 'exact', head: true })
        .eq('checklist_futuro_id', checklist.id)
        .eq('colaborador_id', colaborador_id)

      if (periodoInicio) {
        queryRespostas = queryRespostas.gte('created_at', periodoInicio)
      }

      const [resItens, resRespostas] = await Promise.all([
        supabase
          .from('checklist_futuro_itens')
          .select('*', { count: 'exact', head: true })
          .eq('checklist_futuro_id', checklist.id),
        queryRespostas,
      ])

      return {
        ...checklist,
        total_perguntas: resItens.count || 0,
        respostas_count: resRespostas.count || 0,
      }
    })
  )

  return NextResponse.json(checklistsComContagem)
}
