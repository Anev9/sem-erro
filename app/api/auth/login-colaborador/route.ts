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
    const emailNorm = email.toLowerCase().trim()

    // 1. Verificar se existe na tabela colaboradores
    const { data: colaborador, error: findError } = await supabase
      .from('colaboradores')
      .select('*, empresas(nome_fantasia)')
      .ilike('email', emailNorm)
      .neq('ativo', false)
      .maybeSingle()

    if (findError || !colaborador) {
      return NextResponse.json({ error: 'E-mail ou senha incorretos' }, { status: 401 })
    }

    // 2. Tentar login direto no Supabase Auth
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const authRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': anonKey },
      body: JSON.stringify({ email: emailNorm, password }),
    })

    if (authRes.ok) {
      // Senha correta — vincular auth_id se necessário
      const authData = await authRes.json()
      if (authData.user?.id && !colaborador.auth_id) {
        await supabase.from('colaboradores').update({ auth_id: authData.user.id }).eq('id', colaborador.id)
        colaborador.auth_id = authData.user.id
      }
    } else {
      // Login falhou — buscar conta Auth pelo email
      const { data: listData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
      const authUser = listData?.users?.find(u => u.email?.toLowerCase() === emailNorm)

      if (authUser) {
        // Conta existe mas senha errada
        if (password === DEFAULT_PASSWORD) {
          // Resetar senha e corrigir auth_id se necessário
          await supabase.auth.admin.updateUserById(authUser.id, { password: DEFAULT_PASSWORD })
          if (authUser.id !== colaborador.auth_id) {
            await supabase.from('colaboradores').update({ auth_id: authUser.id }).eq('id', colaborador.id)
            colaborador.auth_id = authUser.id
          }
        } else {
          return NextResponse.json({ error: 'E-mail ou senha incorretos' }, { status: 401 })
        }
      } else {
        // Conta não existe — criar agora com a senha fornecida
        const { data: created, error: createError } = await supabase.auth.admin.createUser({
          email: emailNorm,
          password,
          email_confirm: true,
          user_metadata: { nome: colaborador.nome, role: 'colaborador' },
        })

        if (createError) {
          console.error('[login-colaborador] erro ao criar conta:', createError.message)
          return NextResponse.json(
            { error: 'Não foi possível criar a conta. Tente com a senha: 123mudar' },
            { status: 500 }
          )
        }

        await supabase.from('colaboradores').update({ auth_id: created.user!.id }).eq('id', colaborador.id)
        colaborador.auth_id = created.user!.id
      }
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

    const response = NextResponse.json({ isColaborador: true, profile })
    response.cookies.set('semerro-colaborador-id', String(colaborador.id), {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 horas
    })
    return response
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[login-colaborador]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
