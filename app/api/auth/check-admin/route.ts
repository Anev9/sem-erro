import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Usa service role para bypassar RLS e verificar se o usuário é admin
function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(request: NextRequest) {
  try {
    const { user_id, email } = await request.json()

    if (!user_id) {
      return NextResponse.json({ isAdmin: false }, { status: 400 })
    }

    const supabase = db()

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
