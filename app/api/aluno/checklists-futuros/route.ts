import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const empresaId = searchParams.get('empresa_id')
  const checklistId = searchParams.get('checklist_id')
  const alunoId = searchParams.get('aluno_id')

  // Itens de um checklist específico
  if (checklistId) {
    const { data, error } = await db()
      .from('checklist_futuro_itens')
      .select('id, titulo, ordem')
      .eq('checklist_futuro_id', checklistId)
      .order('ordem')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data || [])
  }

  // Checklists de uma empresa
  if (empresaId) {
    const { data, error } = await db()
      .from('checklists_futuros')
      .select('id, titulo')
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data || [])
  }

  // Todos os checklists das empresas do aluno
  if (alunoId) {
    const { data: empresas } = await db()
      .from('empresas')
      .select('id')
      .eq('aluno_id', alunoId)

    const empresaIds = (empresas || []).map((e: any) => e.id)
    if (empresaIds.length === 0) return NextResponse.json([])

    const { data, error } = await db()
      .from('checklists_futuros')
      .select('*, empresas(nome_fantasia), colaboradores(nome)')
      .in('empresa_id', empresaIds)
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data || [])
  }

  return NextResponse.json({ error: 'Parâmetro obrigatório: empresa_id, checklist_id ou aluno_id' }, { status: 400 })
}
