import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// GET /api/colaborador/sessao — verifica o cookie e retorna o perfil
export async function GET(request: NextRequest) {
  const colaboradorId = request.cookies.get('semerro-colaborador-id')?.value

  if (!colaboradorId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const supabase = db()

  const { data: colaborador, error } = await supabase
    .from('colaboradores')
    .select('*, empresas(nome_fantasia)')
    .eq('id', Number(colaboradorId))
    .or('ativo.is.null,ativo.eq.true')
    .maybeSingle()

  if (error || !colaborador) {
    return NextResponse.json({ error: 'Sessão inválida ou colaborador inativo' }, { status: 401 })
  }

  return NextResponse.json({
    id: colaborador.id,
    auth_id: colaborador.auth_id,
    email: colaborador.email,
    nome: colaborador.nome,
    role: 'colaborador',
    empresa_id: colaborador.empresa_id,
    empresa_nome: colaborador.empresas?.nome_fantasia,
    cargo: colaborador.cargo,
    foto_url: colaborador.foto_url ?? null,
    celular: colaborador.celular ?? null,
    created_at: colaborador.created_at,
  })
}

// POST /api/colaborador/sessao — limpa os cookies (logout)
export async function POST() {
  const response = NextResponse.json({ ok: true })
  const cookieOpts = { httpOnly: true, sameSite: 'lax' as const, path: '/', maxAge: 0 }
  response.cookies.set('semerro-colaborador-id', '', cookieOpts)
  response.cookies.set('sem-erro-token', '', cookieOpts)
  response.cookies.set('sem-erro-refresh-token', '', cookieOpts)
  return response
}
