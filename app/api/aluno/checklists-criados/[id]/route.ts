import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: checklistId } = await params
  const { searchParams } = new URL(request.url)
  const alunoId = searchParams.get('aluno_id')

  if (!alunoId) return NextResponse.json({ error: 'aluno_id obrigatório' }, { status: 400 })

  const { data: empresas } = await db()
    .from('empresas')
    .select('id')
    .eq('aluno_id', alunoId)

  const empresaIds = (empresas || []).map((e: any) => e.id)

  const { data: checklist, error: clError } = await db()
    .from('checklists_futuros')
    .select('*, empresas(nome_fantasia), colaboradores(nome)')
    .eq('id', checklistId)
    .in('empresa_id', empresaIds)
    .single()

  if (clError || !checklist) {
    return NextResponse.json({ error: 'Checklist não encontrado' }, { status: 404 })
  }

  const [{ data: itens }, { data: respostas }, { data: acoes }] = await Promise.all([
    db().from('checklist_futuro_itens').select('*').eq('checklist_futuro_id', checklistId).order('ordem'),
    db().from('checklist_respostas').select('*').eq('checklist_futuro_id', checklistId),
    db().from('acoes_corretivas').select('id, titulo, status, prioridade, responsavel, prazo, item_id').eq('checklist_id', checklistId),
  ])

  return NextResponse.json({
    checklist,
    itens: itens || [],
    respostas: respostas || [],
    acoes: acoes || [],
  })
}