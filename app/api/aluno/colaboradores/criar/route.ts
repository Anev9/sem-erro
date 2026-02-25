import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// POST body: { email, senha, nome, celular, cargo, empresa_id }
export async function POST(request: NextRequest) {
  try {
    const { email, senha, nome, celular, cargo, empresa_id } = await request.json()

    const supabase = db()

    // Verificar se o colaborador já está cadastrado nesta empresa específica
    const { data: existingColab } = await supabase
      .from('colaboradores')
      .select('id')
      .eq('email', email)
      .eq('empresa_id', empresa_id)
      .maybeSingle()

    if (existingColab) {
      return NextResponse.json({ error: 'Este colaborador já está cadastrado nesta empresa' }, { status: 400 })
    }

    // Criar usuário no Supabase Auth usando service role (sem precisar de confirmação de email)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome, role: 'colaborador' }
    })

    let authUserId: string
    let authCriado = false

    if (authError) {
      // Se o email já existe no Auth (cadastro anterior com falha de rollback ou outro papel)
      const jaRegistrado =
        authError.message.includes('already been registered') ||
        authError.message.includes('already registered')

      if (!jaRegistrado) {
        return NextResponse.json({ error: authError.message || 'Erro ao criar conta' }, { status: 400 })
      }

      // Buscar o auth_id do usuário existente pelo email
      const { data: listData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
      const existingAuthUser = listData?.users?.find((u) => u.email === email)

      if (!existingAuthUser) {
        return NextResponse.json({ error: 'Email já registrado. Tente outro email.' }, { status: 400 })
      }

      // Atualizar a senha do usuário existente para a nova senha informada
      await supabase.auth.admin.updateUserById(existingAuthUser.id, {
        password: senha,
        user_metadata: { nome, role: 'colaborador' }
      })

      authUserId = existingAuthUser.id
    } else if (!authData.user) {
      return NextResponse.json({ error: 'Erro ao criar conta' }, { status: 400 })
    } else {
      authUserId = authData.user.id
      authCriado = true
    }

    // Inserir na tabela colaboradores
    const { error: colabError } = await supabase
      .from('colaboradores')
      .insert({
        auth_id: authUserId,
        empresa_id,
        nome,
        email,
        celular: celular || null,
        cargo,
        ativo: true
      })

    if (colabError) {
      // Rollback: remover usuário criado no Auth (somente se foi criado agora)
      if (authCriado) {
        await supabase.auth.admin.deleteUser(authUserId)
      }
      return NextResponse.json({ error: colabError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}
