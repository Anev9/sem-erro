import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET ?aluno_id=X  → lista colaboradores das empresas do aluno
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const alunoId = searchParams.get('aluno_id')
  if (!alunoId) return NextResponse.json({ error: 'aluno_id obrigatório' }, { status: 400 })

  const { data: empresas } = await db()
    .from('empresas')
    .select('id')
    .eq('aluno_id', alunoId)

  const empresaIds = (empresas || []).map((e: any) => e.id)
  if (empresaIds.length === 0) return NextResponse.json([])

  const { data, error } = await db()
    .from('colaboradores')
    .select('*, empresas(nome_fantasia)')
    .in('empresa_id', empresaIds)
    .eq('ativo', true)
    .order('nome')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

// PATCH body: { id, ativo }  → ativa/desativa colaborador
export async function PATCH(request: NextRequest) {
  const { id, ativo } = await request.json()
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
  const { error } = await db().from('colaboradores').update({ ativo }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// PUT body: { id, nome, email, celular, cargo }  → atualiza dados
export async function PUT(request: NextRequest) {
  const { id, ...campos } = await request.json()
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
  const { error } = await db().from('colaboradores').update(campos).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
