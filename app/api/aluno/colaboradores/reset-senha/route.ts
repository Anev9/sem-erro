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

    const emailNorm = String(colaborador.email || '').toLowerCase().trim()

    // Encontra (ou cria) a conta no Supabase Auth pelo e-mail e vincula o auth_id.
    // O login autentica pelo e-mail, então a senha precisa ser trocada exatamente
    // na conta Auth desse e-mail — não confiar cegamente no auth_id salvo.
    async function resolverAuthId(): Promise<{ authId: string } | { erro: string }> {
      let existingAuthUser: { id: string } | undefined

      // 1. auth_id salvo, desde que o e-mail da conta bata com o do colaborador
      if (colaborador!.auth_id) {
        const { data: byId } = await supabase.auth.admin.getUserById(colaborador!.auth_id)
        if (byId?.user?.email?.toLowerCase() === emailNorm) existingAuthUser = byId.user
      }

      // 2. busca paginada por e-mail (case-insensitive)
      for (let page = 1; !existingAuthUser && page <= 50; page++) {
        const { data: listData } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
        const users = listData?.users ?? []
        existingAuthUser = users.find((u) => u.email?.toLowerCase() === emailNorm)
        if (users.length < 1000) break
      }

      let novoAuthId: string
      if (existingAuthUser) {
        novoAuthId = existingAuthUser.id
      } else {
        const { data: created, error: createError } = await supabase.auth.admin.createUser({
          email: emailNorm,
          password: RESET_PASSWORD,
          email_confirm: true,
          user_metadata: { role: 'colaborador' }
        })
        if (createError) {
          return { erro: 'Erro ao criar conta: ' + createError.message }
        }
        novoAuthId = created.user!.id
      }

      if (novoAuthId !== colaborador!.auth_id) {
        await supabase.from('colaboradores').update({ auth_id: novoAuthId }).eq('id', colaborador_id)
      }
      return { authId: novoAuthId }
    }

    const resolvido = await resolverAuthId()
    if ('erro' in resolvido) return NextResponse.json({ error: resolvido.erro }, { status: 500 })

    // Resetar a senha no Supabase Auth
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      resolvido.authId,
      { password: RESET_PASSWORD }
    )

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
