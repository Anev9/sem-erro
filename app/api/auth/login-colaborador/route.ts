import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const DEFAULT_PASSWORD = process.env.COLABORADOR_DEFAULT_PASSWORD || ''

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const { allowed, retryAfterSec } = checkRateLimit(ip)
    if (!allowed) {
      return NextResponse.json(
        { error: `Muitas tentativas. Tente novamente em ${retryAfterSec} segundos.` },
        { status: 429 }
      )
    }

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

    const authController = new AbortController()
    const authTimeout = setTimeout(() => authController.abort(), 10000)
    let authRes: Response
    try {
      authRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': anonKey },
        body: JSON.stringify({ email: emailNorm, password }),
        signal: authController.signal,
      })
    } catch (fetchErr) {
      clearTimeout(authTimeout)
      console.error('[login-colaborador] timeout/erro na chamada auth:', fetchErr)
      return NextResponse.json({ error: 'Serviço de autenticação indisponível. Tente novamente.' }, { status: 503 })
    } finally {
      clearTimeout(authTimeout)
    }

    if (authRes.ok) {
      // Senha correta — vincular auth_id se necessário
      const authData = await authRes.json()
      if (authData.user?.id && !colaborador.auth_id) {
        await supabase.from('colaboradores').update({ auth_id: authData.user.id }).eq('id', colaborador.id)
        colaborador.auth_id = authData.user.id
      }
    } else {
      // Login falhou — buscar conta Auth
      let authUser: { id: string; email?: string } | null = null

      // Tentativa 1: buscar direto pelo auth_id se disponível
      if (colaborador.auth_id) {
        const { data: byId } = await supabase.auth.admin.getUserById(colaborador.auth_id)
        if (byId?.user?.email?.toLowerCase() === emailNorm) {
          authUser = byId.user
        }
      }

      // Tentativa 2: buscar pelo email via listUsers (com timeout para não travar em produção)
      if (!authUser) {
        const listResult = await Promise.race([
          supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000))
        ])
        if (listResult && 'data' in listResult) {
          authUser = listResult.data?.users?.find(u => u.email?.toLowerCase() === emailNorm) ?? null
        }
      }

      if (authUser) {
        // Conta existe mas senha errada
        if (password === DEFAULT_PASSWORD) {
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
          // Tratar caso onde o email já existe mas não foi encontrado pelo listUsers
          if (createError.message?.toLowerCase().includes('already')) {
            if (password === DEFAULT_PASSWORD) {
              const listResult2 = await Promise.race([
                supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
                new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000))
              ])
              const found = listResult2 && 'data' in listResult2
                ? listResult2.data?.users?.find(u => u.email?.toLowerCase() === emailNorm)
                : undefined
              if (found) {
                await supabase.auth.admin.updateUserById(found.id, { password: DEFAULT_PASSWORD })
                await supabase.from('colaboradores').update({ auth_id: found.id }).eq('id', colaborador.id)
                colaborador.auth_id = found.id
              } else {
                return NextResponse.json({ error: 'Conta de acesso com problema. Contate o administrador.' }, { status: 500 })
              }
            } else {
              return NextResponse.json({ error: 'E-mail já cadastrado. Tente com a senha padrão.' }, { status: 401 })
            }
          } else {
            console.error('[login-colaborador] erro ao criar conta:', createError.message)
            return NextResponse.json({ error: 'Não foi possível criar a conta. Tente com a senha padrão.' }, { status: 500 })
          }
        } else {
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

    const response = NextResponse.json({ isColaborador: true, profile })
    const isProd = process.env.NODE_ENV === 'production'
    response.cookies.set('semerro-colaborador-id', String(colaborador.id), {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      secure: isProd,
    })
    return response
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[login-colaborador]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
