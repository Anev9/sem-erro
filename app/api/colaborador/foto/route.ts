import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// POST /api/colaborador/foto — salva foto_url do colaborador
// Usa o token JWT (sem-erro-token) como auth principal,
// e semerro-colaborador-id como fallback
export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // 1. Tentar via token JWT
  const token = request.cookies.get('sem-erro-token')?.value
  const colaboradorIdCookie = request.cookies.get('semerro-colaborador-id')?.value

  if (!token && !colaboradorIdCookie) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { foto_url } = await request.json()
  if (!foto_url) {
    return NextResponse.json({ error: 'foto_url é obrigatório' }, { status: 400 })
  }

  let colaboradorId: number | null = null

  // Tentar via JWT primeiro
  if (token) {
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user } } = await anonClient.auth.getUser(token)

    if (user?.id) {
      const { data: colab } = await supabase
        .from('colaboradores')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle()
      if (colab) colaboradorId = colab.id
    }
  }

  // Fallback: usar cookie numérico
  if (!colaboradorId && colaboradorIdCookie) {
    colaboradorId = Number(colaboradorIdCookie)
  }

  if (!colaboradorId) {
    return NextResponse.json({ error: 'Colaborador não encontrado' }, { status: 401 })
  }

  const { error } = await supabase
    .from('colaboradores')
    .update({ foto_url })
    .eq('id', colaboradorId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, colaboradorId })
}
