import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    const senhaCorreta = process.env.ALUNO_DEFAULT_PASSWORD
    if (!senhaCorreta || password !== senhaCorreta) {
      return NextResponse.json({ error: 'E-mail ou senha incorretos' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: aluno, error } = await supabase
      .from('alunos')
      .select('*')
      .eq('e-mail', email)
      .single()

    if (!aluno || error) {
      return NextResponse.json({ error: 'E-mail ou senha incorretos' }, { status: 401 })
    }

    return NextResponse.json({
      id: aluno.id,
      aluno_id: aluno.id,
      email: aluno['e-mail'],
      full_name: aluno.nome_fantasia || aluno['e-mail'],
      role: 'aluno',
      created_at: aluno.created_at
    })
  } catch {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
