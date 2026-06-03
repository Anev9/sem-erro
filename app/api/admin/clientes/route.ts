import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function isAdmin(request: NextRequest): boolean {
  return !!request.cookies.get('sem-erro-admin')?.value
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Acesso restrito' }, { status: 403 })

  const { nome, email, senha, programa } = await request.json()

  if (!nome || !email || !senha) {
    return NextResponse.json({ error: 'Nome, e-mail e senha são obrigatórios' }, { status: 400 })
  }

  const supabase = db()

  // Verificar se e-mail já existe
  const { data: existente } = await supabase
    .from('alunos')
    .select('id')
    .eq('e-mail', email.toLowerCase().trim())
    .maybeSingle()

  if (existente) {
    return NextResponse.json({ error: 'Este e-mail já está cadastrado' }, { status: 409 })
  }

  const hash = await bcrypt.hash(senha, 12)

  const { data, error } = await supabase
    .from('alunos')
    .insert({
      clientes: nome.trim(),
      'e-mail': email.toLowerCase().trim(),
      senha: hash,
      programa: programa || null,
      ativo: true,
      tipo: 'aluno',
    })
    .select('id, clientes, "e-mail", programa, ativo')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Acesso restrito' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const { data, error } = await db()
    .from('alunos')
    .select('id, observacoes')
    .eq('id', id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Acesso restrito' }, { status: 403 })

  const body = await request.json()
  const { id } = body
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const campos: Record<string, unknown> = {}
  if (body.observacoes !== undefined) campos.observacoes = body.observacoes ?? null
  if (body.ativo !== undefined) campos.ativo = body.ativo

  if (Object.keys(campos).length === 0)
    return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })

  const { error } = await db().from('alunos').update(campos).eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
