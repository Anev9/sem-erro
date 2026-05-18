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
    const alunoId = request.cookies.get('sem-erro-aluno-id')?.value
    if (!alunoId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { email, senha, nome, celular, cargo, empresa_id } = await request.json()

    if (!email || !senha || !nome || !cargo || !empresa_id) {
      return NextResponse.json({ error: 'email, senha, nome, cargo e empresa_id são obrigatórios' }, { status: 400 })
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 })
    }

    const supabase = db()

    // Verificar que a empresa pertence ao aluno logado
    const { data: empresa } = await supabase
      .from('empresas')
      .select('id')
      .eq('id', empresa_id)
      .eq('aluno_id', alunoId)
      .maybeSingle()

    if (!empresa) {
      return NextResponse.json({ error: 'Sem permissão para adicionar colaborador nesta empresa' }, { status: 403 })
    }

    // Verificar se já existe colaborador com este email nesta empresa (ativo ou inativo)
    const { data: existingColab } = await supabase
      .from('colaboradores')
      .select('id, ativo, auth_id')
      .eq('email', email)
      .eq('empresa_id', empresa_id)
      .maybeSingle()

    // Resolver o auth_id (criar ou reutilizar conta existente no Supabase Auth)
    let authUserId: string
    let authCriado = false

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome, role: 'colaborador' }
    })

    if (authError) {
      const jaRegistrado =
        authError.message.includes('already been registered') ||
        authError.message.includes('already registered')

      if (!jaRegistrado) {
        return NextResponse.json({ error: authError.message || 'Erro ao criar conta' }, { status: 400 })
      }

      // Email já existe no Auth — buscar o usuário e atualizar senha
      const { data: listData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
      const existingAuthUser = listData?.users?.find((u) => u.email === email)

      if (!existingAuthUser) {
        return NextResponse.json({ error: 'Email já registrado em outro sistema. Tente outro email.' }, { status: 400 })
      }

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

    // Se já existe registro nesta empresa (ativo ou inativo), reativar e atualizar dados
    if (existingColab) {
      const { error: colabError } = await supabase
        .from('colaboradores')
        .update({ auth_id: authUserId, nome, celular: celular || null, cargo, ativo: true })
        .eq('id', existingColab.id)

      if (colabError) {
        if (authCriado) await supabase.auth.admin.deleteUser(authUserId)
        return NextResponse.json({ error: colabError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    // Inserir novo registro de colaborador
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
      if (authCriado) await supabase.auth.admin.deleteUser(authUserId)
      return NextResponse.json({ error: colabError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
