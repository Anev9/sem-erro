import { NextRequest, NextResponse } from 'next/server'
import { getColaboradorId } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { inicioPeriodo } from '@/lib/periodo'

const db = createAdminClient


// GET /api/colaborador/checklists
export async function GET(request: NextRequest) {
  const colaborador_id = getColaboradorId(request)

  if (!colaborador_id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
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

  // Buscar itens e respostas de todos os checklists em 2 consultas (em vez de
  // 2 por checklist) e tabular as contagens em memória.
  const checklistIds = checklists.map((c) => c.id)

  const [itensRes, respostasRes] = await Promise.all([
    supabase
      .from('checklist_futuro_itens')
      .select('checklist_futuro_id')
      .in('checklist_futuro_id', checklistIds),
    supabase
      .from('checklist_respostas')
      .select('checklist_futuro_id, respondido_em')
      .in('checklist_futuro_id', checklistIds)
      .eq('colaborador_id', colaborador_id),
  ])

  const totalPerguntasPorChecklist = new Map<string, number>()
  for (const item of itensRes.data ?? []) {
    totalPerguntasPorChecklist.set(
      item.checklist_futuro_id,
      (totalPerguntasPorChecklist.get(item.checklist_futuro_id) ?? 0) + 1
    )
  }

  const respostasPorChecklist = new Map<string, { respondido_em: string | null }[]>()
  for (const resposta of respostasRes.data ?? []) {
    const lista = respostasPorChecklist.get(resposta.checklist_futuro_id) ?? []
    lista.push(resposta)
    respostasPorChecklist.set(resposta.checklist_futuro_id, lista)
  }

  const checklistsComContagem = checklists.map((checklist) => {
    const periodoInicio = inicioPeriodo(checklist.recorrencia ?? null)
    const respostas = respostasPorChecklist.get(checklist.id) ?? []
    const respostasCount = periodoInicio
      ? respostas.filter((r) => r.respondido_em && r.respondido_em >= periodoInicio).length
      : respostas.length

    return {
      ...checklist,
      total_perguntas: totalPerguntasPorChecklist.get(checklist.id) ?? 0,
      respostas_count: respostasCount,
    }
  })

  return NextResponse.json(checklistsComContagem)
}
