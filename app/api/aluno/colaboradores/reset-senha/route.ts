import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { getAlunoId } from '@/lib/auth'

const db = createAdminClient


const RESET_PASSWORD = process.env.COLABORADOR_DEFAULT_PASSWORD || ''

// POST body: { colaborador_id } — reseta a senha para a senha padrão definida em COLABORADOR_DEFAULT_PASSWORD
export async function POST(request: NextRequest) {
  try {
    const alunoId = getAlunoId(request)
    if (!alunoId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { colaborador_id } = await request.json()

    if (!colaborador_id) {
      return NextResponse.json({ error: 'colaborador_id é obrigatório' }, { status: 400 })
    }

    if (!RESET_PASSWORD) {
      return NextResponse.json(
        { error: 'Senha padrão não configurada no servidor (variável COLABORADOR_DEFAULT_PASSWORD ausente).' },
        { status: 500 }
      )
    }

    const supabase = db()

    // Buscar o colaborador
    const { data: colaborador, error: findError } = await supabase
      .from('colaboradores')
      .select('auth_id, email, empresa_id')
      .eq('id', colaborador_id)
      .maybeSingle()

    if (findError || !colaborador) {
      return NextResponse.json({ error: 'Colaborador não encontrado' }, { status: 404 })
    }

    // Verificar que o colaborador pertence a uma empresa do aluno autenticado
    const { data: empresa } = await supabase
      .from('empresas')
      .select('id')
      .eq('id', colaborador.empresa_id)
      .eq('aluno_id', alunoId)
      .single()

    if (!empresa) {
      return NextResponse.json({ error: 'Sem permissão para resetar a senha deste colaborador' }, { status: 403 })
    }

    // Encontra (ou cria) a conta no Supabase Auth pelo e-mail e vincula o auth_id
    async function resolverAuthId(): Promise<{ authId: string } | { erro: string }> {
      const { data: listData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
      const existingAuthUser = listData?.users?.find((u) => u.email === colaborador!.email)

      let novoAuthId: string
      if (existingAuthUser) {
        novoAuthId = existingAuthUser.id
      } else {
        const { data: created, error: createError } = await supabase.auth.admin.createUser({
          email: colaborador!.email,
          password: RESET_PASSWORD,
          email_confirm: true,
          user_metadata: { role: 'colaborador' }
        })
        if (createError) {
          return { erro: 'Erro ao criar conta: ' + createError.message }
        }
        novoAuthId = created.user!.id
      }

      await supabase.from('colaboradores').update({ auth_id: novoAuthId }).eq('id', colaborador_id)
      return { authId: novoAuthId }
    }

    let authId = colaborador.auth_id

    if (!authId) {
      // Colaborador não tem conta no Supabase Auth — verificar se já existe pelo email, ou criar
      const resolvido = await resolverAuthId()
      if ('erro' in resolvido) return NextResponse.json({ error: resolvido.erro }, { status: 500 })
      authId = resolvido.authId
    }

    // Resetar a senha no Supabase Auth
    let { error: updateError } = await supabase.auth.admin.updateUserById(
      authId,
      { password: RESET_PASSWORD }
    )

    if (updateError) {
      // auth_id pode estar "órfão" (conta apagada diretamente no Supabase Auth,
      // por exemplo) — tenta re-resolver pelo e-mail e refazer o reset uma vez
      // antes de desistir.
      const resolvido = await resolverAuthId()
      if ('erro' in resolvido) return NextResponse.json({ error: resolvido.erro }, { status: 500 })

      const retry = await supabase.auth.admin.updateUserById(resolvido.authId, { password: RESET_PASSWORD })
      updateError = retry.error
    }

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
