import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function getAlunoId(request: NextRequest): string | null {
  return request.cookies.get('sem-erro-aluno-id')?.value || null
}

// GET → lista colaboradores das empresas do aluno autenticado
export async function GET(request: NextRequest) {
  const alunoId = getAlunoId(request)
  if (!alunoId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: empresas } = await db()
    .from('empresas')
    .select('id')
    .eq('aluno_id', alunoId)

  const empresaIds = (empresas || []).map((e: { id: string }) => e.id)
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

// PATCH body: { id, ativo } → ativa/desativa colaborador do aluno autenticado
export async function PATCH(request: NextRequest) {
  const alunoId = getAlunoId(request)
  if (!alunoId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id, ativo } = await request.json()
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  // Verificar se o colaborador pertence a uma empresa do aluno autenticado
  const { data: colab } = await db().from('colaboradores').select('empresa_id').eq('id', id).single()
  if (!colab) return NextResponse.json({ error: 'Colaborador não encontrado' }, { status: 404 })

  const { data: empresa } = await db().from('empresas').select('id').eq('id', colab.empresa_id).eq('aluno_id', alunoId).single()
  if (!empresa) return NextResponse.json({ error: 'Sem permissão para alterar este colaborador' }, { status: 403 })

  const { error } = await db().from('colaboradores').update({ ativo }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// PUT body: { id, nome, email, celular, cargo, empresa_id } → atualiza dados do colaborador
export async function PUT(request: NextRequest) {
  const alunoId = getAlunoId(request)
  if (!alunoId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await request.json()
  const { id } = body
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  // Verificar se o colaborador pertence a uma empresa do aluno autenticado
  const { data: colab } = await db().from('colaboradores').select('empresa_id').eq('id', id).single()
  if (!colab) return NextResponse.json({ error: 'Colaborador não encontrado' }, { status: 404 })

  const { data: empresa } = await db().from('empresas').select('id').eq('id', colab.empresa_id).eq('aluno_id', alunoId).single()
  if (!empresa) return NextResponse.json({ error: 'Sem permissão para atualizar este colaborador' }, { status: 403 })

  const allowedFields = ['nome', 'email', 'celular', 'cargo', 'empresa_id']
  const campos = Object.fromEntries(
    Object.entries(body).filter(([key]) => allowedFields.includes(key))
  )
  const { error } = await db().from('colaboradores').update(campos).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
