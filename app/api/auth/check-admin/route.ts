import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

// Usa service role para bypassar RLS e verificar se o usuário é admin
const db = createAdminClient


export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json().catch(() => ({}))

    const token = request.cookies.get('sem-erro-token')?.value
    if (!token) {
      return NextResponse.json({ isAdmin: false }, { status: 401 })
    }

    const supabase = db()

    // Verificar o JWT e obter a identidade real do requisitante — nunca confiar
    // em um user_id enviado pelo cliente.
    const { data: authData, error: authErr } = await supabase.auth.getUser(token)
    if (authErr || !authData?.user) {
      return NextResponse.json({ isAdmin: false }, { status: 401 })
    }
    const user_id = authData.user.id

    // Busca o perfil na tabela user_profiles usando service role (ignora RLS)
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user_id)
      .maybeSingle()

    if (profile) {
      return NextResponse.json({
        isAdmin: true,
        profile: {
          id: profile.id,
          email: profile.email || email,
          full_name: profile.full_name || profile.name || email,
          role: 'admin',
        }
      })
    }

    // Verifica também se é colaborador
    const { data: colaborador } = await supabase
      .from('colaboradores')
      .select('*, empresas(nome_fantasia)')
      .eq('auth_id', user_id)
      .eq('ativo', true)
      .maybeSingle()

    if (colaborador) {
      return NextResponse.json({
        isAdmin: false,
        isColaborador: true,
        profile: {
          id: colaborador.id,
          auth_id: colaborador.auth_id,
          email: colaborador.email,
          nome: colaborador.nome,
          role: 'colaborador',
          empresa_id: colaborador.empresa_id,
          empresa_nome: colaborador.empresas?.nome_fantasia,
          cargo: colaborador.cargo,
          created_at: colaborador.created_at,
        }
      })
    }

    return NextResponse.json({ isAdmin: false, isColaborador: false })
  } catch {
    return NextResponse.json({ isAdmin: false }, { status: 500 })
  }
}
