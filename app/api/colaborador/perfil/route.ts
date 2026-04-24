import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// PATCH /api/colaborador/perfil — atualiza nome e celular
export async function PATCH(request: NextRequest) {
  const colaboradorId = request.cookies.get('semerro-colaborador-id')?.value

  if (!colaboradorId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const { nome, celular, foto_url } = body

  if (!nome?.trim()) {
    return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
  }

  const supabase = db()

  const { error } = await supabase
    .from('colaboradores')
    .update({
      nome: nome.trim(),
      celular: celular?.trim() || null,
      ...(foto_url !== undefined && { foto_url }),
    })
    .eq('id', Number(colaboradorId))

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
