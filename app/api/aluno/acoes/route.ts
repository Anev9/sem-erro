import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function getAlunoId(request: NextRequest): string | null {
  return request.cookies.get('sem-erro-aluno-id')?.value || null
}

export async function GET(request: NextRequest) {
  try {
    const alunoId = getAlunoId(request)
    if (!alunoId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const supabase = getServiceClient()

    // Buscar empresas do aluno autenticado
    const { data: empresas, error: empresasError } = await supabase
      .from('empresas')
      .select('id, nome_fantasia')
      .eq('aluno_id', alunoId)
      .eq('ativo', true)

    if (empresasError) {
      return NextResponse.json({ error: empresasError.message }, { status: 500 })
    }

    if (!empresas || empresas.length === 0) {
      return NextResponse.json({ empresas: [], acoes: [] })
    }

    const empresaIds = empresas.map((e: { id: string }) => e.id)

    // Buscar ações
    const { data: acoes, error: acoesError } = await supabase
      .from('acoes_corretivas')
      .select('*, empresas(nome_fantasia), checklists_futuros(titulo), checklist_futuro_itens(titulo)')
      .in('empresa_id', empresaIds)
      .order('created_at', { ascending: false })

    if (acoesError) {
      return NextResponse.json({ error: acoesError.message }, { status: 500 })
    }

    return NextResponse.json({ empresas, acoes: acoes || [] })
  } catch {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const alunoId = getAlunoId(request)
    if (!alunoId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await request.json()

    if (!body.empresa_id || !body.titulo) {
      return NextResponse.json({ error: 'empresa_id e titulo são obrigatórios' }, { status: 400 })
    }

    const supabase = getServiceClient()

    // Verificar que a empresa pertence ao aluno autenticado
    const { data: empresa } = await supabase
      .from('empresas')
      .select('id')
      .eq('id', body.empresa_id)
      .eq('aluno_id', alunoId)
      .single()

    if (!empresa) {
      return NextResponse.json({ error: 'Sem permissão para criar ação nesta empresa' }, { status: 403 })
    }

    const { data, error } = await supabase.from('acoes_corretivas').insert([body]).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const alunoId = getAlunoId(request)
    if (!alunoId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

    const body = await request.json()
    const supabase = getServiceClient()

    const { data: acao } = await supabase.from('acoes_corretivas').select('empresa_id').eq('id', id).single()
    if (!acao) return NextResponse.json({ error: 'Ação não encontrada' }, { status: 404 })

    const { data: empresa } = await supabase.from('empresas').select('id').eq('id', acao.empresa_id).eq('aluno_id', alunoId).single()
    if (!empresa) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

    const { titulo, descricao, responsavel, prazo, status, prioridade, categoria, orcamento, valor_pago, observacoes, urgente } = body
    const { data, error } = await supabase
      .from('acoes_corretivas')
      .update({ titulo, descricao, responsavel, prazo, status, prioridade, categoria, orcamento, valor_pago, observacoes, urgente })
      .eq('id', id)
      .select('*, empresas(nome_fantasia), checklists_futuros(titulo), checklist_futuro_itens(titulo)')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const alunoId = getAlunoId(request)
    if (!alunoId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
    }

    const supabase = getServiceClient()

    // Verificar se a ação pertence a uma empresa do aluno autenticado
    const { data: acao } = await supabase
      .from('acoes_corretivas')
      .select('empresa_id')
      .eq('id', id)
      .single()

    if (!acao) {
      return NextResponse.json({ error: 'Ação não encontrada' }, { status: 404 })
    }

    const { data: empresa } = await supabase
      .from('empresas')
      .select('id')
      .eq('id', acao.empresa_id)
      .eq('aluno_id', alunoId)
      .single()

    if (!empresa) {
      return NextResponse.json({ error: 'Sem permissão para excluir esta ação' }, { status: 403 })
    }

    const { error } = await supabase
      .from('acoes_corretivas')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
