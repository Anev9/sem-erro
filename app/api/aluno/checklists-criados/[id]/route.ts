import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { getAlunoId } from '@/lib/auth'

const db = createAdminClient

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const alunoId = getAlunoId(request)
  if (!alunoId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id: checklistId } = await params

  // Buscar apenas empresas do aluno autenticado
  const { data: empresas } = await db()
    .from('empresas')
    .select('id')
    .eq('aluno_id', alunoId)

  const empresaIds = (empresas || []).map((e: any) => e.id)

  // Filtrar checklist pelo id E pelas empresas do aluno (garante ownership)
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
