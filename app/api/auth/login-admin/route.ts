import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { loginSchema } from '@/lib/schemas'
import { logger } from '@/lib/logger'
import { setSessionCookies } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase-admin'

const serviceDb = createAdminClient


function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const { allowed, retryAfterSec } = await checkRateLimit(ip, 'admin')
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
    const emailNorm = email.toLowerCase().trim()

    if (!getAdminEmails().includes(emailNorm)) {
      return NextResponse.json({ isAdmin: false })
    }

    const db = serviceDb()

    // Verificar se o usuário já existe no Supabase Auth (paginado, sem carregar tudo na memória)
    let existingUser: { id: string; email?: string } | undefined
    let page = 1
    while (page <= 10) {
      const { data: authList } = await db.auth.admin.listUsers({ page, perPage: 100 })
      const users = authList?.users ?? []
      existingUser = users.find((u) => u.email?.toLowerCase() === emailNorm)
      if (existingUser || users.length < 100) break
      page++
    }

    let userId: string | undefined = existingUser?.id
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    let session: Awaited<ReturnType<typeof anonClient.auth.signInWithPassword>>['data'] | undefined

    if (!existingUser) {
      // Primeiro login de um e-mail em ADMIN_EMAILS: provisiona a conta com a senha informada
      const { data: created, error: createError } = await db.auth.admin.createUser({
        email: emailNorm,
        password,
        email_confirm: true,
        user_metadata: { full_name: 'Administrador', role: 'admin' },
      })
      if (createError) {
        return NextResponse.json({ error: 'Erro ao criar conta: ' + createError.message }, { status: 500 })
      }
      userId = created?.user?.id

      const { data: newSession, error: signInError } = await anonClient.auth.signInWithPassword({ email: emailNorm, password })
      if (signInError || !newSession?.session?.access_token) {
        logger.error('login-admin', 'Falha ao obter sessão JWT após criar conta', { message: signInError?.message })
        return NextResponse.json({ error: 'Erro ao iniciar sessão. Tente novamente.' }, { status: 500 })
      }
      session = newSession
    } else {
      // Conta já existe: a senha precisa bater com a senha atual — nunca sobrescrever sem verificar
      const { data: signedIn, error: signInError } = await anonClient.auth.signInWithPassword({ email: emailNorm, password })
      if (signInError || !signedIn?.session?.access_token) {
        return NextResponse.json({ error: 'E-mail ou senha incorretos' }, { status: 401 })
      }
      session = signedIn
    }

    const profile = {
      id: userId ?? emailNorm,
      email: emailNorm,
      full_name: 'Administrador',
      role: 'admin',
    }

    if (userId) {
      await db.from('user_profiles').upsert({
        id: userId,
        email: emailNorm,
        full_name: 'Administrador',
        role: 'admin',
        updated_at: new Date().toISOString(),
      })
    }

    if (!session?.session?.access_token) {
      logger.error('login-admin', 'Sessão ausente após autenticação')
      return NextResponse.json({ error: 'Erro ao iniciar sessão. Tente novamente.' }, { status: 500 })
    }

    const response = NextResponse.json({ isAdmin: true, profile })
    setSessionCookies(response, session.session.access_token, session.session.refresh_token, [
      { name: 'sem-erro-admin', value: '1' },
    ])
    return response

  } catch (err) {
    logger.error('login-admin', 'Erro interno', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
