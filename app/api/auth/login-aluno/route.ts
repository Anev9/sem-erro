import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validação de entrada
    if (!email || !password) {
      return NextResponse.json({ error: 'E-mail e senha são obrigatórios' }, { status: 400 })
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Coluna de email na tabela se chama 'e-mail' (com hífen)
    const { data: aluno, error } = await supabase
      .from('alunos')
      .select('*')
      .eq('e-mail', email)
      .single()

    if (!aluno || error) {
      return NextResponse.json({ error: 'E-mail ou senha incorretos' }, { status: 401 })
    }

    // Admin não pode logar pela rota de aluno — deve usar o login Supabase Auth
    if (aluno['tipo'] === 'admin') {
      return NextResponse.json({ error: 'E-mail ou senha incorretos' }, { status: 401 })
    }

    const senhaCorreta = aluno['senha'] || process.env.ALUNO_DEFAULT_PASSWORD || '123mudar'
    const senhaOk = password === senhaCorreta

    if (!senhaOk) {
      return NextResponse.json({ error: 'E-mail ou senha incorretos' }, { status: 401 })
    }

    const userData = {
      id: aluno.id,
      aluno_id: aluno.id,
      email: aluno['e-mail'],
      full_name: aluno['clientes'] || aluno['e-mail'],
      role: 'aluno',
      tipo: aluno['tipo'],
      programa: aluno['programa'],
      ativo: aluno['ativo'],
      created_at: aluno['created_at'],
    }

    const response = NextResponse.json(userData)

    // Cookie HttpOnly para proteger rotas via middleware
    response.cookies.set('sem-erro-aluno-id', String(aluno.id), {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 horas
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
