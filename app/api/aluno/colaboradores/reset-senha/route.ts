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

    let authId = colaborador.auth_id

    if (!authId) {
      // Colaborador não tem conta no Supabase Auth — verificar se já existe pelo email
      const { data: listData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
      const existingAuthUser = listData?.users?.find((u) => u.email === colaborador.email)

      if (existingAuthUser) {
        authId = existingAuthUser.id
      } else {
        // Criar nova conta no Supabase Auth
        const { data: created, error: createError } = await supabase.auth.admin.createUser({
          email: colaborador.email,
          password: '123mudar',
          email_confirm: true,
          user_metadata: { role: 'colaborador' }
        })
        if (createError) {
          return NextResponse.json({ error: 'Erro ao criar conta: ' + createError.message }, { status: 500 })
        }
        authId = created.user!.id
      }

      // Salvar o auth_id na tabela colaboradores
      await supabase.from('colaboradores').update({ auth_id: authId }).eq('id', colaborador_id)
    }

    // Resetar a senha no Supabase Auth
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      authId,
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
