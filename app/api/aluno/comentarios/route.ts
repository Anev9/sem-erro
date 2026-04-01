import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/aluno/comentarios?checklist_id=xxx
export async function GET(request: NextRequest) {
  const alunoId = request.cookies.get('sem-erro-aluno-id')?.value
  if (!alunoId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const checklistId = request.nextUrl.searchParams.get('checklist_id')
  if (!checklistId) return NextResponse.json({ error: 'checklist_id obrigatório' }, { status: 400 })

  const supabase = db()

  // Verify ownership
  const { data: empresas } = await supabase.from('empresas').select('id').eq('aluno_id', alunoId)
  const empresaIds = (empresas || []).map((e: { id: string }) => e.id)
  if (empresaIds.length === 0) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { data: cl } = await supabase.from('checklists_futuros').select('id').eq('id', checklistId).in('empresa_id', empresaIds).single()
  if (!cl) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { data, error } = await supabase
    .from('checklist_item_comentarios')
    .select('id, item_id, autor, texto, created_at')
    .eq('checklist_id', checklistId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

// POST /api/aluno/comentarios — criar comentário
// body: { checklist_id, item_id, texto, autor? }
export async function POST(request: NextRequest) {
  const alunoId = request.cookies.get('sem-erro-aluno-id')?.value
  if (!alunoId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await request.json()
  const { checklist_id, item_id, texto, autor } = body
  if (!checklist_id || !item_id || !texto?.trim()) {
    return NextResponse.json({ error: 'checklist_id, item_id e texto são obrigatórios' }, { status: 400 })
  }

  const supabase = db()

  // Verify ownership
  const { data: empresas } = await supabase.from('empresas').select('id').eq('aluno_id', alunoId)
  const empresaIds = (empresas || []).map((e: { id: string }) => e.id)
  if (empresaIds.length === 0) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { data: cl } = await supabase.from('checklists_futuros').select('id').eq('id', checklist_id).in('empresa_id', empresaIds).single()
  if (!cl) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { data, error } = await supabase
    .from('checklist_item_comentarios')
    .insert([{ checklist_id, item_id, texto: texto.trim(), autor: autor?.trim() || 'Gestor' }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/aluno/comentarios?id=xxx
export async function DELETE(request: NextRequest) {
  const alunoId = request.cookies.get('sem-erro-aluno-id')?.value
  if (!alunoId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const comentarioId = request.nextUrl.searchParams.get('id')
  if (!comentarioId) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const supabase = db()

  // Verify ownership via join
  const { data: empresas } = await supabase.from('empresas').select('id').eq('aluno_id', alunoId)
  const empresaIds = (empresas || []).map((e: { id: string }) => e.id)
  if (empresaIds.length === 0) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { data: com } = await supabase.from('checklist_item_comentarios').select('checklist_id').eq('id', comentarioId).single()
  if (!com) return NextResponse.json({ error: 'Comentário não encontrado' }, { status: 404 })

  const { data: cl } = await supabase.from('checklists_futuros').select('id').eq('id', com.checklist_id).in('empresa_id', empresaIds).single()
  if (!cl) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { error } = await supabase.from('checklist_item_comentarios').delete().eq('id', comentarioId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
