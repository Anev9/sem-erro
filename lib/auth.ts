import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

// Fonte de verdade para a identidade do colaborador autenticado: o cookie
// httpOnly setado pelo servidor no login, nunca um valor vindo de query/body.
export function getColaboradorId(request: NextRequest): string | null {
  return request.cookies.get('semerro-colaborador-id')?.value ?? null
}

// Fonte de verdade para a identidade do aluno autenticado: o cookie
// httpOnly setado pelo servidor no login, nunca um valor vindo de query/body.
export function getAlunoId(request: NextRequest): string | null {
  return request.cookies.get('sem-erro-aluno-id')?.value ?? null
}

const THIRTY_DIAS = 60 * 60 * 24 * 30
const UMA_HORA = 60 * 60

// Grava os cookies httpOnly de sessão (token + refresh token + cookie de
// identidade específico do papel) com as mesmas opções de segurança em todo
// login — evita que os 3 fluxos (aluno/colaborador/admin) divirjam entre si.
export function setSessionCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string | null | undefined,
  extra: { name: string; value: string; maxAge?: number }[] = []
): void {
  const isProd = process.env.NODE_ENV === 'production'
  const cookieOpts = { httpOnly: true, sameSite: 'lax' as const, path: '/', secure: isProd }

  response.cookies.set('sem-erro-token', accessToken, { ...cookieOpts, maxAge: UMA_HORA })
  if (refreshToken) {
    response.cookies.set('sem-erro-refresh-token', refreshToken, { ...cookieOpts, maxAge: THIRTY_DIAS })
  }
  for (const { name, value, maxAge } of extra) {
    response.cookies.set(name, value, { ...cookieOpts, maxAge: maxAge ?? THIRTY_DIAS })
  }
}

function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

// Verifica a sessão de admin de verdade: o JWT em sem-erro-token precisa ser
// válido E pertencer a um e-mail que está em ADMIN_EMAILS agora. A presença
// isolada do cookie sem-erro-admin não basta — ele não é revogado ao expirar
// o acesso de um admin, e ficaria válido por até 30 dias.
export async function isAdmin(request: NextRequest): Promise<boolean> {
  if (!request.cookies.get('sem-erro-admin')?.value) return false

  const token = request.cookies.get('sem-erro-token')?.value
  if (!token) return false

  const { data, error } = await createAdminClient().auth.getUser(token)
  if (error || !data?.user?.email) return false

  return getAdminEmails().includes(data.user.email.toLowerCase())
}
