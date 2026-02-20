import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const alunoId = searchParams.get('aluno_id')

    if (!alunoId) {
      return NextResponse.json({ error: 'aluno_id obrigatório' }, { status: 400 })
    }

    // Service role bypassa RLS — seguro pois é server-side
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Buscar empresas do aluno
    const { data: empresas, error: empresasError } = await supabase
      .from('empresas')
      .select('id, nome_fantasia')
      .eq('aluno_id', alunoId)
      .eq('ativo', true)

    if (empresasError) {
      return NextResponse.json({ error: empresasError.message }, { status: 500 })
    }

    if (!empresas || empresas.length === 0) {
      return NextResponse.json({ empresas: [], checklists: [], todosChecklists: [] })
    }

    const empresaIds = empresas.map((e: any) => e.id)

    // 2. Buscar checklists dos últimos 30 dias
    const dataLimite = new Date()
    dataLimite.setDate(dataLimite.getDate() - 30)

    const { data: checklists, error: checklistsError } = await supabase
      .from('checklists')
      .select('id, nome, descricao, status, created_at, empresa_id, empresas(nome_fantasia)')
      .in('empresa_id', empresaIds)
      .gte('created_at', dataLimite.toISOString())
      .order('created_at', { ascending: false })

    if (checklistsError) {
      return NextResponse.json({ error: checklistsError.message }, { status: 500 })
    }

    // 3. Buscar todos os checklists para performance
    const { data: todosChecklists, error: todosError } = await supabase
      .from('checklists')
      .select('id, empresa_id, status')
      .in('empresa_id', empresaIds)

    if (todosError) {
      return NextResponse.json({ error: todosError.message }, { status: 500 })
    }

    return NextResponse.json({
      empresas,
      checklists: checklists || [],
      todosChecklists: todosChecklists || [],
    })
  } catch {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
