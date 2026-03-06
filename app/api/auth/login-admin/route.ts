import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function serviceDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const ADMIN_EMAILS_FIXOS = [
  'cobranca@midasolution.com.br',
  'admin@semerro.com',
  'marcelasetubal23@gmail.com',
]

function getAdminEmails(): string[] {
  const fromEnv = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return Array.from(new Set([...ADMIN_EMAILS_FIXOS, ...fromEnv]))
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'E-mail e senha são obrigatórios' }, { status: 400 })
    }

    const emailNorm = email.toLowerCase().trim()

    if (!getAdminEmails().includes(emailNorm)) {
      return NextResponse.json({ isAdmin: false })
    }

    const db = serviceDb()

    // Verificar se o usuário já existe no Supabase Auth
    const { data: authList } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const existingUser = authList?.users?.find((u) => u.email?.toLowerCase() === emailNorm)

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

    // Montar resposta com cookie de autenticação admin
    const response = NextResponse.json({ isAdmin: true, profile })
    response.cookies.set('sem-erro-admin', '1', {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 horas
    })
    return response

  } catch (err) {
    console.error('login-admin error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
