import { NextRequest, NextResponse } from 'next/server'

// Rotas públicas que não precisam de autenticação
const PUBLIC_PATHS = ['/', '/login', '/alterar-senha', '/contratar']
const PUBLIC_PREFIXES = ['/api/', '/_next/', '/favicon', '/logo', '/logo-semerro']

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (isPublic(pathname)) return NextResponse.next()

  // 1. Cookie de aluno (setado pelo login-aluno API)
  const alunoCookie = req.cookies.get('sem-erro-aluno-id')
  if (alunoCookie?.value) return NextResponse.next()

  // 2. Cookie de admin (setado pelo login-admin API)
  const adminCookie = req.cookies.get('sem-erro-admin')
  if (adminCookie?.value) return NextResponse.next()

  // 3. Sessão Supabase (colaboradores)
  const hasSupabaseSession = req.cookies.getAll().some(
    (c) => c.name.includes('-auth-token') && c.value
  )
  if (hasSupabaseSession) return NextResponse.next()

  // Não autenticado → redirecionar para login
  const loginUrl = req.nextUrl.clone()
  loginUrl.pathname = '/login'
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
