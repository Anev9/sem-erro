import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const DEFAULT_PASSWORD = '123mudar'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'E-mail e senha são obrigatórios' }, { status: 400 })
    }

    const supabase = db()

    // Buscar colaborador pelo email
    const { data: colaborador, error: findError } = await supabase
      .from('colaboradores')
      .select('*, empresas(nome_fantasia)')
      .eq('email', email.toLowerCase().trim())
      .eq('ativo', true)
      .maybeSingle()

    if (findError || !colaborador) {
      return NextResponse.json({ error: 'E-mail ou senha incorretos' }, { status: 401 })
    }

    let authOk = false

    if (colaborador.auth_id) {
      // Já tem conta — tentar logar via Supabase Auth
      const anonClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { error: authError } = await anonClient.auth.signInWithPassword({ email, password })
      authOk = !authError
    } else {
      // Sem conta — só aceita a senha padrão
      if (password !== DEFAULT_PASSWORD) {
        return NextResponse.json({ error: 'E-mail ou senha incorretos' }, { status: 401 })
      }

      // Criar conta no Supabase Auth
      const { data: listData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
      const existingAuthUser = listData?.users?.find((u) => u.email === email.toLowerCase().trim())

      let authId: string

      if (existingAuthUser) {
        authId = existingAuthUser.id
        await supabase.auth.admin.updateUserById(authId, { password: DEFAULT_PASSWORD })
      } else {
        const { data: created, error: createError } = await supabase.auth.admin.createUser({
          email: email.toLowerCase().trim(),
          password: DEFAULT_PASSWORD,
          email_confirm: true,
          user_metadata: { nome: colaborador.nome, role: 'colaborador' }
        })
        if (createError) {
          return NextResponse.json({ error: 'Erro ao criar conta: ' + createError.message }, { status: 500 })
        }
        authId = created.user!.id
      }

      // Salvar auth_id
      await supabase.from('colaboradores').update({ auth_id: authId }).eq('id', colaborador.id)
      colaborador.auth_id = authId
      authOk = true
    }

    if (!authOk) {
      return NextResponse.json({ error: 'E-mail ou senha incorretos' }, { status: 401 })
    }

    const profile = {
      id: colaborador.id,
      auth_id: colaborador.auth_id,
      email: colaborador.email,
      nome: colaborador.nome,
      role: 'colaborador',
      empresa_id: colaborador.empresa_id,
      empresa_nome: colaborador.empresas?.nome_fantasia,
      cargo: colaborador.cargo,
      created_at: colaborador.created_at,
    }

    return NextResponse.json({ isColaborador: true, profile })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
