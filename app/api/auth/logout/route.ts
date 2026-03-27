import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.set('sem-erro-aluno-id', '', { httpOnly: true, sameSite: 'strict', path: '/', maxAge: 0 })
  response.cookies.set('sem-erro-admin', '', { httpOnly: true, sameSite: 'strict', path: '/', maxAge: 0 })
  response.cookies.set('semerro-colaborador-id', '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 })
  return response
}
