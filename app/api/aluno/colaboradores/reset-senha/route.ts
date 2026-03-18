import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// POST body: { colaborador_id } — reseta a senha para "123mudar"
export async function POST(request: NextRequest) {
  try {
    const { colaborador_id } = await request.json()

    if (!colaborador_id) {
      return NextResponse.json({ error: 'colaborador_id é obrigatório' }, { status: 400 })
    }

    const supabase = db()

    // Buscar o auth_id do colaborador
    const { data: colaborador, error: findError } = await supabase
      .from('colaboradores')
      .select('auth_id, email')
      .eq('id', colaborador_id)
      .maybeSingle()

    if (findError || !colaborador) {
      return NextResponse.json({ error: 'Colaborador não encontrado' }, { status: 404 })
    }

    // Resetar a senha no Supabase Auth
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      colaborador.auth_id,
      { password: '123mudar' }
    )

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
