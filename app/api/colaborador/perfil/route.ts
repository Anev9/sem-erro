import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// PATCH /api/colaborador/perfil — atualiza nome, celular e/ou foto_url (parcial)
export async function PATCH(request: NextRequest) {
  const colaboradorId = request.cookies.get('semerro-colaborador-id')?.value

  if (!colaboradorId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const { nome, celular, foto_url } = body

  if (nome !== undefined && !nome?.trim()) {
    return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (nome !== undefined) updates.nome = nome.trim()
  if (celular !== undefined) updates.celular = celular?.trim() || null
  if (foto_url !== undefined) updates.foto_url = foto_url

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
  }

  const supabase = db()

  const { error } = await supabase
    .from('colaboradores')
    .update(updates)
    .eq('id', Number(colaboradorId))

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
