import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: NextRequest) {
  const alunoId = request.cookies.get('sem-erro-aluno-id')?.value
  if (!alunoId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const empresaId = searchParams.get('empresa_id')
  const checklistId = searchParams.get('checklist_id')

  // Itens de um checklist específico — verificar ownership via empresa
  if (checklistId) {
    const { data: checklist } = await db()
      .from('checklists_futuros')
      .select('id, empresa_id')
      .eq('id', checklistId)
      .single()

    if (!checklist) return NextResponse.json({ error: 'Checklist não encontrado' }, { status: 404 })

    const { data: empresa } = await db()
      .from('empresas')
      .select('id')
      .eq('id', checklist.empresa_id)
      .eq('aluno_id', alunoId)
      .single()

    if (!empresa) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

    const { data, error } = await db()
      .from('checklist_futuro_itens')
      .select('id, titulo, ordem')
      .eq('checklist_futuro_id', checklistId)
      .order('ordem')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data || [])
  }

  // Checklists de uma empresa — verificar que empresa pertence ao aluno
  if (empresaId) {
    const { data: empresa } = await db()
      .from('empresas')
      .select('id')
      .eq('id', empresaId)
      .eq('aluno_id', alunoId)
      .single()

    if (!empresa) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

    const { data, error } = await db()
      .from('checklists_futuros')
      .select('id, titulo')
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data || [])
  }

  // Todos os checklists das empresas do aluno autenticado
  const { data: empresas } = await db()
    .from('empresas')
    .select('id')
    .eq('aluno_id', alunoId)

  const empresaIds = (empresas || []).map((e: { id: string }) => e.id)
  if (empresaIds.length === 0) return NextResponse.json([])

  const { data, error } = await db()
    .from('checklists_futuros')
    .select('*, empresas(nome_fantasia), colaboradores(nome)')
    .in('empresa_id', empresaIds)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}
