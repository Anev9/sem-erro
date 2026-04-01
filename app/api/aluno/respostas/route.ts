import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

function db() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

type Empresa = Pick<Database['public']['Tables']['empresas']['Row'], 'id' | 'nome_fantasia'>
type ChecklistFuturo = Pick<Database['public']['Tables']['checklists_futuros']['Row'], 'id' | 'titulo' | 'empresa_id' | 'colaborador_id' | 'created_at'>
type Resposta = Pick<Database['public']['Tables']['checklist_respostas']['Row'], 'id' | 'resposta' | 'observacao' | 'item_id' | 'checklist_futuro_id'>
type Item = Pick<Database['public']['Tables']['checklist_futuro_itens']['Row'], 'id' | 'titulo'>
type Colaborador = Pick<Database['public']['Tables']['colaboradores']['Row'], 'id' | 'nome'>

// GET [&empresa_id=Y][&data_inicio=Z][&data_fim=W][&resultado=conforme|nao_conforme]
export async function GET(request: NextRequest) {
  try {
    const alunoId = request.cookies.get('sem-erro-aluno-id')?.value
    if (!alunoId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { searchParams } = new URL(request.url)

    // 1. Empresas do aluno autenticado
    const { data: empresas } = await db()
      .from('empresas')
      .select('id, nome_fantasia')
      .eq('aluno_id', Number(alunoId))

    const empresaIds = (empresas as Empresa[] || []).map((e) => e.id)
    if (empresaIds.length === 0) return NextResponse.json({ empresas: [], respostas: [] })

    // 2. Filtro opcional por empresa_id (deve pertencer ao aluno)
    const empresaIdFiltro = searchParams.get('empresa_id')
    const empresaIdsFiltrados = empresaIdFiltro
      ? empresaIds.filter((id) => id === empresaIdFiltro)
      : empresaIds

    if (empresaIdsFiltrados.length === 0) return NextResponse.json({ empresas: empresas || [], respostas: [] })

    // 3. Checklists dessas empresas (com filtro de data, se informado)
    const dataInicio = searchParams.get('data_inicio')
    const dataFim = searchParams.get('data_fim')

    let checklistsQuery = db()
      .from('checklists_futuros')
      .select('id, titulo, empresa_id, colaborador_id, created_at')
      .in('empresa_id', empresaIdsFiltrados)

    if (dataInicio) checklistsQuery = checklistsQuery.gte('created_at', dataInicio)
    if (dataFim) checklistsQuery = checklistsQuery.lte('created_at', dataFim + 'T23:59:59')

    const { data: checklists } = await checklistsQuery

    const checklistIds = (checklists as ChecklistFuturo[] || []).map((c) => c.id)
    if (checklistIds.length === 0) return NextResponse.json({ empresas: empresas || [], respostas: [] })

    // 4. Respostas
    const query = db()
      .from('checklist_respostas')
      .select('id, resposta, observacao, item_id, checklist_futuro_id')
      .in('checklist_futuro_id', checklistIds)
      .order('id', { ascending: false })

    const { data: respostasRaw, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (!respostasRaw || respostasRaw.length === 0) {
      return NextResponse.json({ empresas: empresas || [], respostas: [] })
    }

    // 5. Itens dos checklists
    const itemIds = [...new Set((respostasRaw as Resposta[]).map((r) => r.item_id).filter((id): id is string => id !== null))]
    const { data: itens } = await db()
      .from('checklist_futuro_itens')
      .select('id, titulo')
      .in('id', itemIds)

    // 6. Colaboradores
    const colaboradorIds = [...new Set(
      (checklists as ChecklistFuturo[] || []).filter((c) => c.colaborador_id).map((c) => c.colaborador_id as string)
    )]
    const { data: colaboradores } = colaboradorIds.length > 0
      ? await db().from('colaboradores').select('id, nome').in('id', colaboradorIds)
      : { data: [] }

    // 7. Montar mapas
    const itensMap = Object.fromEntries((itens as Item[] || []).map((i) => [i.id, i]))
    const checklistsMap = Object.fromEntries((checklists as ChecklistFuturo[] || []).map((c) => [c.id, c]))
    const empresasMap = Object.fromEntries((empresas as Empresa[] || []).map((e) => [e.id, e]))
    const colaboradoresMap = Object.fromEntries((colaboradores as Colaborador[] || []).map((c) => [c.id, c]))

    // 8. Mapear e filtrar resultado
    const resultado = searchParams.get('resultado')

    let respostasMapeadas = (respostasRaw as Resposta[]).map((r) => {
      const checklist = checklistsMap[r.checklist_futuro_id]
      const item = itensMap[r.item_id]
      const empresa = checklist ? empresasMap[checklist.empresa_id] : null
      const colaborador = checklist?.colaborador_id ? colaboradoresMap[checklist.colaborador_id] : null

      const resultadoMapeado: string =
        r.resposta === 'sim' ? 'conforme' :
        r.resposta === 'nao' ? 'nao_conforme' : 'na'

      const dataFormatada = checklist?.created_at
        ? new Date(checklist.created_at).toLocaleDateString('pt-BR')
        : ''

      return {
        id: r.id,
        empresa: empresa?.nome_fantasia || 'Desconhecida',
        empresa_id: empresa?.id || null,
        checklist: checklist?.titulo || 'Desconhecido',
        pergunta: item?.titulo || 'Item desconhecido',
        resposta: r.resposta === 'sim' ? 'Sim' : r.resposta === 'nao' ? 'Não' : 'N/A',
        resultado: resultadoMapeado,
        responsavel: colaborador?.nome || '-',
        data: dataFormatada,
        observacao: r.observacao || ''
      }
    })

    if (resultado && resultado !== 'todos') {
      respostasMapeadas = respostasMapeadas.filter((r) => r.resultado === resultado)
    }

    return NextResponse.json({ empresas: empresas || [], respostas: respostasMapeadas })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
