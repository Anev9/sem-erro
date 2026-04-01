import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const token = request.cookies.get('sem-erro-token')?.value

  // Invalidar sessão no Supabase Auth
  if (token) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase.auth.admin.signOut(token).catch(() => {
      // Ignorar erro — cookie será apagado de qualquer forma
    })
  }

  const response = NextResponse.json({ success: true })
  const clear = { httpOnly: true, sameSite: 'lax' as const, path: '/', maxAge: 0 }
  response.cookies.set('sem-erro-token', '', clear)
  response.cookies.set('sem-erro-refresh-token', '', clear)
  response.cookies.set('sem-erro-aluno-id', '', clear)
  response.cookies.set('sem-erro-admin', '', clear)
  response.cookies.set('semerro-colaborador-id', '', clear)
  return response
}
