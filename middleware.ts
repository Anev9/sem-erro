import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const PUBLIC_PATHS = ['/', '/login', '/alterar-senha', '/contratar']
const STATIC_PREFIXES = ['/_next/', '/favicon', '/logo', '/logo-semerro']
const PUBLIC_API_PATHS = [
  '/api/auth/login-aluno',
  '/api/auth/login-admin',
  '/api/auth/login-colaborador',
  '/api/auth/logout',
  '/api/auth/check-admin',
  '/api/sw',
  '/api/asaas/criar-assinatura',
]

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true
  if (STATIC_PREFIXES.some((p) => pathname.startsWith(p))) return true
  if (PUBLIC_API_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) return true
  return false
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const COOKIE_OPTS = { httpOnly: true, sameSite: 'lax' as const, path: '/' }

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (isPublic(pathname)) return NextResponse.next()

  const token = req.cookies.get('sem-erro-token')?.value
  const refreshToken = req.cookies.get('sem-erro-refresh-token')?.value

  // 1. Verificar token atual
  if (token) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    const { data: { user } } = await supabase.auth.getUser(token)
    if (user) return NextResponse.next()
  }

  // 2. Token expirado ou ausente — tentar renovar via refresh_token
  if (refreshToken) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken })

    if (!error && data.session) {
      const { access_token, refresh_token: newRefreshToken } = data.session
      const isProd = process.env.NODE_ENV === 'production'
      const opts = { ...COOKIE_OPTS, secure: isProd }

      const response = NextResponse.next()
      response.cookies.set('sem-erro-token', access_token, { ...opts, maxAge: 60 * 60 })
      response.cookies.set('sem-erro-refresh-token', newRefreshToken, { ...opts, maxAge: 60 * 60 * 24 * 30 })
      return response
    }
  }

  // 3. Sem sessão válida — redirecionar
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const loginUrl = req.nextUrl.clone()
  loginUrl.pathname = '/login'
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
