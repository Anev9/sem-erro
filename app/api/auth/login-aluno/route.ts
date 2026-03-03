import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    console.log('[login-aluno] Tentativa de login:', email)
    console.log('[login-aluno] SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'OK' : 'MISSING')
    console.log('[login-aluno] SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'OK' : 'MISSING')

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

    console.log('[login-aluno] Aluno encontrado:', !!aluno)
    if (error) console.log('[login-aluno] Erro na query:', error.message)

    if (!aluno || error) {
      return NextResponse.json({ error: 'E-mail ou senha incorretos' }, { status: 401 })
    }

    const senhaCorreta = aluno['senha'] || process.env.ALUNO_DEFAULT_PASSWORD
    const senhaOk = password === senhaCorreta
    console.log('[login-aluno] Senha confere:', senhaOk)

    if (!senhaOk) {
      return NextResponse.json({ error: 'E-mail ou senha incorretos' }, { status: 401 })
    }

    return NextResponse.json({
      id: aluno.id,
      aluno_id: aluno.id,
      email: aluno['e-mail'],
      full_name: aluno['clientes'] || aluno['e-mail'],
      role: 'aluno',
      tipo: aluno['tipo'],
      programa: aluno['programa'],
      ativo: aluno['ativo'],
      created_at: aluno['created_at']
    })
  } catch (err: any) {
    console.log('[login-aluno] EXCEPTION:', err?.message)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
