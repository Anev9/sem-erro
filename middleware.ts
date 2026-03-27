import { NextRequest, NextResponse } from 'next/server'

// Rotas de página que não precisam de autenticação
const PUBLIC_PATHS = ['/', '/login', '/alterar-senha', '/contratar']

// Prefixos de assets estáticos (sempre públicos)
const STATIC_PREFIXES = ['/_next/', '/favicon', '/logo', '/logo-semerro']

// Rotas de API que são públicas (autenticação, sw, asaas webhook)
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

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (isPublic(pathname)) return NextResponse.next()

  // 1. Cookie de aluno
  const alunoCookie = req.cookies.get('sem-erro-aluno-id')
  if (alunoCookie?.value) return NextResponse.next()

  // 2. Cookie de admin
  const adminCookie = req.cookies.get('sem-erro-admin')
  if (adminCookie?.value) return NextResponse.next()

  // 3. Cookie de colaborador
  const colaboradorCookie = req.cookies.get('semerro-colaborador-id')
  if (colaboradorCookie?.value) return NextResponse.next()

  // 4. Sessão Supabase (fallback para colaboradores via Supabase Auth no browser)
  const hasSupabaseSession = req.cookies.getAll().some(
    (c) => c.name.includes('-auth-token') && c.value
  )
  if (hasSupabaseSession) return NextResponse.next()

  // Não autenticado → para chamadas de página, redirecionar para login
  // Para chamadas de API sem auth, retornar 401
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
