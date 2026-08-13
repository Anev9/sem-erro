import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { getAlunoId } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const alunoId = getAlunoId(request)
    if (!alunoId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const supabase = createAdminClient()

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

    const empresaIds = empresas.map((e: { id: string }) => e.id)

    // 2. Buscar todos os checklists das empresas de uma vez — os "últimos 30
    // dias" são um subconjunto deste mesmo resultado, filtrado em memória em
    // vez de repetir a mesma tabela em uma segunda query.
    const dataLimite = new Date()
    dataLimite.setDate(dataLimite.getDate() - 30)
    const dataLimiteISO = dataLimite.toISOString()

    const { data: todosChecklistsRaw, error: checklistsError } = await supabase
      .from('checklists')
      .select('id, nome, descricao, status, created_at, empresa_id, empresas(nome_fantasia)')
      .in('empresa_id', empresaIds)
      .order('created_at', { ascending: false })

    if (checklistsError) {
      return NextResponse.json({ error: checklistsError.message }, { status: 500 })
    }

    const checklists = (todosChecklistsRaw || []).filter((c) => c.created_at >= dataLimiteISO)
    const todosChecklists = (todosChecklistsRaw || []).map((c) => ({
      id: c.id,
      empresa_id: c.empresa_id,
      status: c.status,
    }))

    return NextResponse.json({
      empresas,
      checklists,
      todosChecklists,
    })
  } catch {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
