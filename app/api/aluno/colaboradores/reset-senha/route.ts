import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const RESET_PASSWORD = process.env.COLABORADOR_DEFAULT_PASSWORD || ''

// POST body: { colaborador_id } — reseta a senha para a senha padrão definida em COLABORADOR_DEFAULT_PASSWORD
export async function POST(request: NextRequest) {
  try {
    const alunoId = request.cookies.get('sem-erro-aluno-id')?.value
    if (!alunoId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { colaborador_id } = await request.json()

    if (!colaborador_id) {
      return NextResponse.json({ error: 'colaborador_id é obrigatório' }, { status: 400 })
    }

    const supabase = db()

    // Buscar o colaborador
    const { data: colaborador, error: findError } = await supabase
      .from('colaboradores')
      .select('auth_id, email, empresa_id')
      .eq('id', colaborador_id)
      .maybeSingle()

    if (findError || !colaborador) {
      return NextResponse.json({ error: 'Colaborador não encontrado' }, { status: 404 })
    }

    // Verificar que o colaborador pertence a uma empresa do aluno autenticado
    const { data: empresa } = await supabase
      .from('empresas')
      .select('id')
      .eq('id', colaborador.empresa_id)
      .eq('aluno_id', alunoId)
      .single()

    if (!empresa) {
      return NextResponse.json({ error: 'Sem permissão para resetar a senha deste colaborador' }, { status: 403 })
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
          password: RESET_PASSWORD,
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
      { password: RESET_PASSWORD }
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
