import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

function db() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// GET — buscar dados completos do aluno
export async function GET(request: NextRequest) {
  const alunoId = request.cookies.get('sem-erro-aluno-id')?.value
  if (!alunoId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data, error } = await db()
    .from('alunos')
    .select('id, clientes, "e-mail", telefone, foto_url, programa, tipo, ativo')
    .eq('id', Number(alunoId))
    .single()

  if (error || !data) return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })

  return NextResponse.json(data)
}

// PATCH — atualizar nome, telefone ou foto_url
export async function PATCH(request: NextRequest) {
  const alunoId = request.cookies.get('sem-erro-aluno-id')?.value
  if (!alunoId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await request.json()
  const { clientes, telefone, foto_url } = body

  const updates: Record<string, unknown> = {}
  if (clientes !== undefined) updates['clientes'] = clientes?.trim() || null
  if (telefone !== undefined) updates['telefone'] = telefone?.trim() || null
  if (foto_url !== undefined) updates['foto_url'] = foto_url

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
  }

  const { error } = await db()
    .from('alunos')
    .update(updates)
    .eq('id', Number(alunoId))

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
