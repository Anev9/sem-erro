import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST body: { email, senha, nome, celular, cargo, empresa_id }
export async function POST(request: NextRequest) {
  try {
    const { email, senha, nome, celular, cargo, empresa_id } = await request.json()

    const supabase = db()

    // Criar usuário no Supabase Auth usando service role (sem precisar de confirmação de email)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome, role: 'colaborador' }
    })

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || 'Erro ao criar conta' }, { status: 400 })
    }

    // Inserir na tabela colaboradores
    const { error: colabError } = await supabase
      .from('colaboradores')
      .insert({
        auth_id: authData.user.id,
        empresa_id,
        nome,
        email,
        celular: celular || null,
        cargo,
        ativo: true
      })

    if (colabError) {
      // Rollback: remover usuário criado no Auth
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: colabError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}
