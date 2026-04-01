import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/aluno/checklists-criados/[id]/versoes — lista versões salvas
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const alunoId = request.cookies.get('sem-erro-aluno-id')?.value
  if (!alunoId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id: checklistId } = await params
  const supabase = db()

  // Verify ownership
  const { data: empresas } = await supabase.from('empresas').select('id').eq('aluno_id', alunoId)
  const empresaIds = (empresas || []).map((e: { id: string }) => e.id)
  if (empresaIds.length === 0) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { data: checklist } = await supabase
    .from('checklists_futuros')
    .select('id')
    .eq('id', checklistId)
    .in('empresa_id', empresaIds)
    .single()

  if (!checklist) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { data, error } = await supabase
    .from('checklist_versoes')
    .select('id, versao, titulo, descricao, itens, created_at')
    .eq('checklist_id', checklistId)
    .order('versao', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

// POST /api/aluno/checklists-criados/[id]/versoes — salva snapshot antes de editar
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const alunoId = request.cookies.get('sem-erro-aluno-id')?.value
  if (!alunoId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id: checklistId } = await params
  const supabase = db()

  // Verify ownership
  const { data: empresas } = await supabase.from('empresas').select('id').eq('aluno_id', alunoId)
  const empresaIds = (empresas || []).map((e: { id: string }) => e.id)
  if (empresaIds.length === 0) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { data: checklist } = await supabase
    .from('checklists_futuros')
    .select('titulo, descricao')
    .eq('id', checklistId)
    .in('empresa_id', empresaIds)
    .single()

  if (!checklist) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  // Get current items
  const { data: itens } = await supabase
    .from('checklist_futuro_itens')
    .select('titulo, descricao, ordem')
    .eq('checklist_futuro_id', checklistId)
    .order('ordem')

  // Determine next version number
  const { data: ultimaVersao } = await supabase
    .from('checklist_versoes')
    .select('versao')
    .eq('checklist_id', checklistId)
    .order('versao', { ascending: false })
    .limit(1)
    .single()

  const proximaVersao = ((ultimaVersao?.versao) || 0) + 1

  const { error } = await supabase.from('checklist_versoes').insert([{
    checklist_id: checklistId,
    versao: proximaVersao,
    titulo: checklist.titulo,
    descricao: checklist.descricao,
    itens: itens || [],
  }])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, versao: proximaVersao })
}
