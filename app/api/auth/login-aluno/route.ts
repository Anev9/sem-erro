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
    let authId: string | null = aluno['auth_id'] ?? null

    if (authId) {
      // Conta Auth já existe — manter senha sincronizada
      await supabase.auth.admin.updateUserById(authId, { password })
    } else {
      // Criar conta no Supabase Auth vinculada ao aluno
      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email: emailNorm,
        password,
        email_confirm: true,
        user_metadata: { aluno_id: aluno.id, role: 'aluno' },
      })

      if (createError && createError.message?.toLowerCase().includes('already')) {
        // Email já existe no Auth — buscar e vincular
        let page = 1
        while (page <= 10) {
          const { data: list } = await supabase.auth.admin.listUsers({ page, perPage: 100 })
          const users = list?.users ?? []
          const found = users.find((u) => u.email?.toLowerCase() === emailNorm)
          if (found) { authId = found.id; break }
          if (users.length < 100) break
          page++
        }
      } else if (!createError && created?.user) {
        authId = created.user.id
      } else if (createError) {
        logger.warn('login-aluno', 'Não foi possível criar conta no Supabase Auth', createError.message)
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
      logger.error('login-aluno', 'Falha ao obter sessão JWT', signInError?.message)
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
