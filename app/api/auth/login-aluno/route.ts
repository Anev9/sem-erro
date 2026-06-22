import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { loginSchema } from '@/lib/schemas'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const { allowed, retryAfterSec } = checkRateLimit(ip, 'aluno')
    if (!allowed) {
      return NextResponse.json(
        { error: `Muitas tentativas. Tente novamente em ${retryAfterSec} segundos.` },
        { status: 429 }
      )
    }

    const parsed = loginSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }, { status: 400 })
    }
    const { email, password } = parsed.data

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Coluna de email na tabela se chama 'e-mail' (com hífen)
    const { data: aluno, error } = await supabase
      .from('alunos')
      .select('*')
      .eq('e-mail', email)
      .single()

    if (!aluno || error) {
      return NextResponse.json({ error: 'E-mail ou senha incorretos' }, { status: 401 })
    }

    // Admin não pode logar pela rota de aluno
    if (aluno['tipo'] === 'admin') {
      return NextResponse.json({ error: 'E-mail ou senha incorretos' }, { status: 401 })
    }

    const senhaCorreta = aluno['senha'] || ''
    if (!senhaCorreta) {
      return NextResponse.json({ error: 'E-mail ou senha incorretos' }, { status: 401 })
    }

    // Verificar senha (bcrypt ou plaintext legado)
    const isBcrypt = senhaCorreta.startsWith('$2b$') || senhaCorreta.startsWith('$2a$')
    const senhaOk = isBcrypt
      ? await bcrypt.compare(password, senhaCorreta)
      : password === senhaCorreta

    if (!senhaOk) {
      return NextResponse.json({ error: 'E-mail ou senha incorretos' }, { status: 401 })
    }

    // Migrar senha plaintext para bcrypt silenciosamente
    if (!isBcrypt) {
      const hash = await bcrypt.hash(password, 12)
      await supabase.from('alunos').update({ senha: hash }).eq('id', aluno.id)
    }

    // Registrar último login (ignora silenciosamente se a coluna não existir)
    await supabase.from('alunos').update({ ultimo_login: new Date().toISOString() }).eq('id', aluno.id)

    // Sincronizar com Supabase Auth para centralizar autenticação
    const emailNorm = email.toLowerCase().trim()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    let authId: string | null = aluno['auth_id'] ?? null

    // Busca direta por email via REST (mais confiável que paginação)
    async function findAuthUserByEmail(email: string): Promise<string | null> {
      try {
        const res = await fetch(
          `${supabaseUrl}/auth/v1/admin/users?filter=${encodeURIComponent(email)}&per_page=1000`,
          { headers: { 'Authorization': `Bearer ${serviceKey}`, 'apikey': serviceKey } }
        )
        if (!res.ok) return null
        const data = await res.json()
        const users: Array<{ id: string; email?: string }> = data.users ?? []
        return users.find((u) => u.email?.toLowerCase() === email)?.id ?? null
      } catch {
        return null
      }
    }

    if (authId) {
      const { error: updateAuthError } = await supabase.auth.admin.updateUserById(authId, {
        password,
        email_confirm: true,
      })
      if (updateAuthError) {
        logger.warn('login-aluno', 'auth_id inválido, buscando conta por email', updateAuthError.message)
        authId = null
        await supabase.from('alunos').update({ auth_id: null }).eq('id', aluno.id)
      }
    }

    if (!authId) {
      // Tentar encontrar conta existente por email antes de criar
      const existingId = await findAuthUserByEmail(emailNorm)

      if (existingId) {
        authId = existingId
        await supabase.auth.admin.updateUserById(authId, { password, email_confirm: true })
      } else {
        const { data: created, error: createError } = await supabase.auth.admin.createUser({
          email: emailNorm,
          password,
          email_confirm: true,
          user_metadata: { aluno_id: aluno.id, role: 'aluno' },
        })

        if (!createError && created?.user) {
          authId = created.user.id
        } else if (createError?.message?.toLowerCase().includes('already')) {
          // Criação falhou por duplicata — tentar buscar novamente
          authId = await findAuthUserByEmail(emailNorm)
          if (authId) {
            await supabase.auth.admin.updateUserById(authId, { password, email_confirm: true })
          }
        } else if (createError) {
          logger.error('login-aluno', 'Falha ao criar conta no Supabase Auth', { error: createError.message, email: emailNorm })
          return NextResponse.json({ error: `Erro ao criar conta: ${createError.message}` }, { status: 500 })
        }
      }

      if (authId) {
        await supabase.from('alunos').update({ auth_id: authId }).eq('id', aluno.id)
      }
    }

    // Obter JWT do Supabase Auth para sessão verificável
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: session, error: signInError } = await anonClient.auth.signInWithPassword({
      email: emailNorm,
      password,
    })
    if (signInError || !session?.session?.access_token) {
      logger.error('login-aluno', 'Falha ao obter sessão JWT', { message: signInError?.message, code: (signInError as { status?: number })?.status })
      return NextResponse.json({ error: 'Erro ao iniciar sessão. Tente novamente.' }, { status: 500 })
    }

    const userData = {
      id: aluno.id,
      aluno_id: aluno.id,
      email: aluno['e-mail'],
      full_name: aluno['clientes'] || aluno['e-mail'],
      role: 'aluno',
      tipo: aluno['tipo'],
      programa: aluno['programa'],
      ativo: aluno['ativo'],
      created_at: aluno['created_at'],
      foto_url: aluno['foto_url'] || null,
      senha_temporaria: aluno['senha_temporaria'] ?? false,
    }

    const isProd = process.env.NODE_ENV === 'production'
    const cookieOpts = { httpOnly: true, sameSite: 'lax' as const, path: '/', secure: isProd }
    const response = NextResponse.json(userData)

    response.cookies.set('sem-erro-token', session.session.access_token, {
      ...cookieOpts,
      maxAge: 60 * 60, // 1 hora (validade do JWT)
    })
    response.cookies.set('sem-erro-refresh-token', session.session.refresh_token, {
      ...cookieOpts,
      maxAge: 60 * 60 * 24 * 30, // 30 dias
    })
    response.cookies.set('sem-erro-aluno-id', String(aluno.id), {
      ...cookieOpts,
      maxAge: 60 * 60 * 24 * 30,
    })

    return response
  } catch (err) {
    logger.error('login-aluno', 'Erro interno', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
