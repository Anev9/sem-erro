import { NextRequest, NextResponse } from 'next/server'
import { getColaboradorId } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { inicioPeriodo } from '@/lib/periodo'

const db = createAdminClient


export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: checklistId } = await params
  const colaboradorId = getColaboradorId(request)

  if (!colaboradorId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const supabase = db()

  const { data: checklist, error: checklistError } = await supabase
    .from('checklists_futuros')
    .select('*, empresas(nome_fantasia)')
    .eq('id', checklistId)
    .single()

  if (checklistError || !checklist) {
    return NextResponse.json({ error: 'Checklist não encontrado' }, { status: 404 })
  }

  // Checklist atribuído a outro colaborador específico — bloqueia
  if (checklist.colaborador_id !== null && checklist.colaborador_id !== colaboradorId) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  // Checklist da empresa inteira (colaborador_id nulo) — verifica se este colaborador é da mesma empresa
  if (checklist.colaborador_id === null && checklist.empresa_id) {
    const { data: colab } = await supabase
      .from('colaboradores')
      .select('empresa_id')
      .eq('id', colaboradorId)
      .single()

    if (!colab || colab.empresa_id !== checklist.empresa_id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }
  }

  const { data: itens, error: itensError } = await supabase
    .from('checklist_futuro_itens')
    .select('*')
    .eq('checklist_futuro_id', checklistId)
    .order('ordem')

  if (itensError) {
    return NextResponse.json({ error: itensError.message }, { status: 500 })
  }

  // Para checklists recorrentes, só carrega respostas do período atual (ajustado UTC-3 Brasil)
  const periodoInicio = inicioPeriodo(checklist.recorrencia ?? null)

  let queryRespostas = supabase
    .from('checklist_respostas')
    .select('*')
    .eq('checklist_futuro_id', checklistId)
    .eq('colaborador_id', colaboradorId)

  if (periodoInicio) {
    queryRespostas = queryRespostas.gte('respondido_em', periodoInicio)
  }

  const { data: respostas } = await queryRespostas

  return NextResponse.json({
    checklist,
    itens: itens || [],
    respostas: respostas || [],
  })
}
