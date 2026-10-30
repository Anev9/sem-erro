import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import bcrypt from 'bcryptjs'
import { logger } from '@/lib/logger'

// A sessão vem do cookie httpOnly criado no login (invisível ao navegador) ou,
// no fluxo do link de recuperação por e-mail, do token Supabase enviado no header.
async function getUsuario(request: NextRequest) {
  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  const token = bearer || request.cookies.get('sem-erro-token')?.value
  if (!token) return null

  const { data: { user }, error } = await createAdminClient().auth.getUser(token)
  if (error || !user) return null
  return user
}

export async function GET(request: NextRequest) {
  const user = await getUsuario(request)
  if (!user) return NextResponse.json({ autenticado: false }, { status: 401 })
  return NextResponse.json({ autenticado: true })
}

export async function POST(request: NextRequest) {
  try {
    const { novaSenha } = await request.json()

    if (!novaSenha || novaSenha.length < 6) {
      return NextResponse.json({ error: 'A senha deve ter no mínimo 6 caracteres.' }, { status: 400 })
    }

    const user = await getUsuario(request)
    if (!user) {
      return NextResponse.json({ error: 'Sessão expirada. Faça login novamente.' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Atualiza no Supabase Auth
    const { error: authUpdateErr } = await supabase.auth.admin.updateUserById(user.id, { password: novaSenha })
    if (authUpdateErr) {
      logger.error('alterar-senha', authUpdateErr.message)
      return NextResponse.json({ error: 'Erro ao salvar nova senha.' }, { status: 500 })
    }

    // Buscar aluno pelo auth_id (ou pelo e-mail, se o vínculo ainda não existir)
    let { data: aluno } = await supabase
      .from('alunos')
      .select('id')
      .eq('auth_id', user.id)
      .maybeSingle()

    if (!aluno && user.email) {
      const { data: porEmail } = await supabase
        .from('alunos')
        .select('id')
        .ilike('e-mail', user.email.toLowerCase())
        .maybeSingle()
      aluno = porEmail
    }

    // Colaborador não tem senha na tabela — a do Supabase Auth basta
    if (!aluno) return NextResponse.json({ ok: true })

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
