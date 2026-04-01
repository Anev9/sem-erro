import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { loginSchema } from '@/lib/schemas'
import { logger } from '@/lib/logger'

function serviceDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

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
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
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

    if (!existingUser) {
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
    } else {
      await db.auth.admin.updateUserById(existingUser.id, { password })
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

    // Obter JWT do Supabase Auth
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: session, error: signInError } = await anonClient.auth.signInWithPassword({
      email: emailNorm,
      password,
    })
    if (signInError || !session?.session?.access_token) {
      logger.error('login-admin', 'Falha ao obter sessão JWT', signInError?.message)
      return NextResponse.json({ error: 'Erro ao iniciar sessão. Tente novamente.' }, { status: 500 })
    }

    const isProd = process.env.NODE_ENV === 'production'
    const cookieOpts = { httpOnly: true, sameSite: 'lax' as const, path: '/', secure: isProd }
    const response = NextResponse.json({ isAdmin: true, profile })
    response.cookies.set('sem-erro-token', session.session.access_token, { ...cookieOpts, maxAge: 60 * 60 })
    response.cookies.set('sem-erro-refresh-token', session.session.refresh_token, { ...cookieOpts, maxAge: 60 * 60 * 24 * 30 })
    response.cookies.set('sem-erro-admin', '1', { ...cookieOpts, maxAge: 60 * 60 * 24 * 30 })
    return response

  } catch (err) {
    logger.error('login-admin', 'Erro interno', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
