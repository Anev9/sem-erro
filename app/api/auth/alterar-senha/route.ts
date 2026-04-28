import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const { novaSenha } = await request.json()

    if (!novaSenha || novaSenha.length < 6) {
      return NextResponse.json({ error: 'A senha deve ter no mínimo 6 caracteres.' }, { status: 400 })
    }

    const token = request.cookies.get('sem-erro-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verificar JWT e obter o usuário
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
    if (authErr || !user) {
      return NextResponse.json({ error: 'Sessão inválida.' }, { status: 401 })
    }

    // Buscar aluno pelo auth_id
    const { data: aluno, error: findErr } = await supabase
      .from('alunos')
      .select('id')
      .eq('auth_id', user.id)
      .maybeSingle()

    if (findErr || !aluno) {
      logger.error('alterar-senha', `Aluno não encontrado para auth_id ${user.id}`)
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })
    }

    const hash = await bcrypt.hash(novaSenha, 12)

    const { error: updateErr } = await supabase
      .from('alunos')
      .update({ senha: hash, senha_temporaria: false })
      .eq('id', aluno.id)

    if (updateErr) {
      logger.error('alterar-senha', updateErr.message)
      return NextResponse.json({ error: 'Erro ao salvar nova senha.' }, { status: 500 })
    }

    logger.info('alterar-senha', `Senha atualizada para aluno ${aluno.id}`)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    logger.error('alterar-senha', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
