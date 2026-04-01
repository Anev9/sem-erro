import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { loginSchema } from '@/lib/schemas'
import { logger } from '@/lib/logger'

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

    const parsed = loginSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }
    const { email, password } = parsed.data

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
      logger.error('login-colaborador', 'Timeout/erro na chamada auth', fetchErr)
      return NextResponse.json({ error: 'Serviço de autenticação indisponível. Tente novamente.' }, { status: 503 })
    } finally {
      clearTimeout(authTimeout)
    }

    let accessToken: string | null = null
    let refreshToken: string | null = null

    if (authRes.ok) {
      // Senha correta — vincular auth_id se necessário
      const authData = await authRes.json()
      accessToken = authData.access_token ?? null
      refreshToken = authData.refresh_token ?? null
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

      // Tentativa 2: buscar por email paginando (máx 100 por página, sem carregar tudo na memória)
      if (!authUser) {
        let page = 1
        outer: while (page <= 10) {
          const listResult = await Promise.race([
            supabase.auth.admin.listUsers({ page, perPage: 100 }),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000))
          ])
          if (!listResult || !('data' in listResult)) break
          const users = listResult.data?.users ?? []
          if (users.length === 0) break
          const found = users.find(u => u.email?.toLowerCase() === emailNorm)
          if (found) { authUser = found; break outer }
          if (users.length < 100) break
          page++
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
              let found: { id: string; email?: string } | undefined
              let page2 = 1
              while (page2 <= 10) {
                const listResult2 = await Promise.race([
                  supabase.auth.admin.listUsers({ page: page2, perPage: 100 }),
                  new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000))
                ])
                if (!listResult2 || !('data' in listResult2)) break
                const users2 = listResult2.data?.users ?? []
                if (users2.length === 0) break
                found = users2.find(u => u.email?.toLowerCase() === emailNorm)
                if (found || users2.length < 100) break
                page2++
              }
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
            logger.error('login-colaborador', 'Erro ao criar conta', createError.message)
            return NextResponse.json({ error: 'Não foi possível criar a conta. Tente com a senha padrão.' }, { status: 500 })
          }
        } else {
          await supabase.from('colaboradores').update({ auth_id: created.user!.id }).eq('id', colaborador.id)
          colaborador.auth_id = created.user!.id
        }
      }
    }

    // Se não obteve token ainda (fluxo de criação/reset), fazer sign in agora
    if (!accessToken) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': anonKey },
        body: JSON.stringify({ email: emailNorm, password }),
      })
      if (res.ok) {
        const data = await res.json()
        accessToken = data.access_token ?? null
        refreshToken = data.refresh_token ?? null
      }
    }

    if (!accessToken) {
      logger.error('login-colaborador', 'Não foi possível obter token de sessão')
      return NextResponse.json({ error: 'Erro ao iniciar sessão. Tente novamente.' }, { status: 500 })
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
    const cookieOpts = { httpOnly: true, sameSite: 'lax' as const, path: '/', secure: isProd }
    response.cookies.set('sem-erro-token', accessToken, { ...cookieOpts, maxAge: 60 * 60 })
    if (refreshToken) {
      response.cookies.set('sem-erro-refresh-token', refreshToken, { ...cookieOpts, maxAge: 60 * 60 * 24 * 30 })
    }
    response.cookies.set('semerro-colaborador-id', String(colaborador.id), { ...cookieOpts, maxAge: 60 * 60 * 24 * 30 })
    return response
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    logger.error('login-colaborador', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
