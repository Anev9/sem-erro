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

    // Buscar colaborador pelo email (case-insensitive)
    // Usa neq('ativo', false) para incluir também registros com ativo = NULL
    const { data: colaborador, error: findError } = await supabase
      .from('colaboradores')
      .select('*, empresas(nome_fantasia)')
      .ilike('email', emailNorm)
      .neq('ativo', false)
      .maybeSingle()

    if (findError || !colaborador) {
      return NextResponse.json({ error: 'E-mail ou senha incorretos' }, { status: 401 })
    }

    // Verificar senha via Supabase Auth REST API
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const authRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
      },
      body: JSON.stringify({ email: emailNorm, password }),
    })

    if (authRes.ok) {
      // Senha correta — garantir que auth_id está vinculado
      const authData = await authRes.json()
      const authUserId = authData.user?.id
      if (authUserId && !colaborador.auth_id) {
        await supabase.from('colaboradores').update({ auth_id: authUserId }).eq('id', colaborador.id)
        colaborador.auth_id = authUserId
      }
    } else {
      // Login falhou — verificar se a conta Auth realmente existe
      let authUserExists = false

      if (colaborador.auth_id) {
        const { data: authUserData } = await supabase.auth.admin.getUserById(colaborador.auth_id)
        // Confirma que o auth user existe e o email bate
        authUserExists = !!authUserData?.user && authUserData.user.email?.toLowerCase() === emailNorm
      }

      if (authUserExists) {
        // Conta existe mas senha está errada
        if (password === DEFAULT_PASSWORD) {
          // Senha padrão: resetar a senha para permitir o acesso
          await supabase.auth.admin.updateUserById(colaborador.auth_id!, { password: DEFAULT_PASSWORD })
        } else {
          return NextResponse.json({ error: 'E-mail ou senha incorretos' }, { status: 401 })
        }
      } else {
        // Conta Auth não existe (ou auth_id está desatualizado) — criar agora
        const { data: created, error: createError } = await supabase.auth.admin.createUser({
          email: emailNorm,
          password,
          email_confirm: true,
          user_metadata: { nome: colaborador.nome, role: 'colaborador' },
        })

        if (createError) {
          // Email já existe no Auth mas com auth_id diferente — tentar vincular
          if (createError.message?.toLowerCase().includes('already')) {
            if (password === DEFAULT_PASSWORD) {
              // Procurar pelo email e resetar a senha
              const { data: listData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
              const found = listData?.users?.find(u => u.email?.toLowerCase() === emailNorm)
              if (found) {
                await supabase.auth.admin.updateUserById(found.id, { password: DEFAULT_PASSWORD })
                await supabase.from('colaboradores').update({ auth_id: found.id }).eq('id', colaborador.id)
                colaborador.auth_id = found.id
              } else {
                return NextResponse.json({ error: 'E-mail ou senha incorretos' }, { status: 401 })
              }
            } else {
              return NextResponse.json({ error: 'E-mail ou senha incorretos' }, { status: 401 })
            }
          } else {
            return NextResponse.json({ error: 'Erro ao criar conta: ' + createError.message }, { status: 500 })
          }
        } else {
          // Conta criada com sucesso — vincular ao colaborador
          await supabase.from('colaboradores').update({ auth_id: created.user!.id }).eq('id', colaborador.id)
          colaborador.auth_id = created.user!.id
        }
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

    return NextResponse.json({ isColaborador: true, profile })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[login-colaborador]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
