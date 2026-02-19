import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const alunoId = searchParams.get('aluno_id')

    if (!alunoId) {
      return NextResponse.json({ error: 'aluno_id obrigatório' }, { status: 400 })
    }

    const supabase = getServiceClient()

    // Buscar empresas do aluno
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

    const empresaIds = empresas.map((e: any) => e.id)

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
    const body = await request.json()
    const supabase = getServiceClient()
    const { data, error } = await supabase.from('acoes_corretivas').insert([body]).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
    }

    const supabase = getServiceClient()

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
