import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

function getAlunoId(request: NextRequest): string | null {
  return request.cookies.get('sem-erro-aluno-id')?.value || null
}

// GET → lista empresas do aluno autenticado
export async function GET(request: NextRequest) {
  const alunoId = getAlunoId(request)
  if (!alunoId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data, error } = await db()
    .from('empresas')
    .select('*')
    .eq('aluno_id', alunoId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

// POST body: { ...campos }  → cria empresa para o aluno autenticado
export async function POST(request: NextRequest) {
  const alunoId = getAlunoId(request)
  if (!alunoId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await request.json()
  const { error, data } = await db()
    .from('empresas')
    .insert([{ ...body, aluno_id: alunoId }])
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PUT body: { id, ...campos }  → atualiza empresa do aluno autenticado
export async function PUT(request: NextRequest) {
  const alunoId = getAlunoId(request)
  if (!alunoId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await request.json()
  const { id } = body
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  // Verificar se a empresa pertence ao aluno autenticado
  const { data: empresa } = await db().from('empresas').select('id').eq('id', id).eq('aluno_id', alunoId).single()
  if (!empresa) return NextResponse.json({ error: 'Sem permissão para atualizar esta empresa' }, { status: 403 })

  // Não permitir alterar o dono da empresa
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, aluno_id: _aluno_id, ...campos } = body
  const { error } = await db().from('empresas').update(campos).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// DELETE ?id=X  → exclui empresa do aluno autenticado
export async function DELETE(request: NextRequest) {
  const alunoId = getAlunoId(request)
  if (!alunoId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  // Verificar se a empresa pertence ao aluno autenticado
  const { data: empresa } = await db().from('empresas').select('id').eq('id', id).eq('aluno_id', alunoId).single()
  if (!empresa) return NextResponse.json({ error: 'Sem permissão para excluir esta empresa' }, { status: 403 })

  const { error } = await db().from('empresas').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
