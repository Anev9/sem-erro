import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET ?aluno_id=X[&empresa_id=Y][&data_inicio=Z][&data_fim=W][&resultado=conforme|nao_conforme]
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const alunoId = searchParams.get('aluno_id')
  if (!alunoId) return NextResponse.json({ error: 'aluno_id obrigatório' }, { status: 400 })

  // 1. Empresas do aluno
  const { data: empresas } = await db()
    .from('empresas')
    .select('id, nome_fantasia')
    .eq('aluno_id', alunoId)

  const empresaIds = (empresas || []).map((e: any) => e.id)
  if (empresaIds.length === 0) return NextResponse.json({ empresas: [], respostas: [] })

  // 2. Filtro opcional por empresa_id
  const empresaIdFiltro = searchParams.get('empresa_id')
  const empresaIdsFiltrados = empresaIdFiltro
    ? empresaIds.filter((id: string) => id === empresaIdFiltro)
    : empresaIds

  if (empresaIdsFiltrados.length === 0) return NextResponse.json({ empresas: empresas || [], respostas: [] })

  // 3. Checklists dessas empresas
  const { data: checklists } = await db()
    .from('checklists_futuros')
    .select('id, titulo, empresa_id, colaborador_id')
    .in('empresa_id', empresaIdsFiltrados)

  const checklistIds = (checklists || []).map((c: any) => c.id)
  if (checklistIds.length === 0) return NextResponse.json({ empresas: empresas || [], respostas: [] })

  // 4. Respostas com filtro de data
  const dataInicio = searchParams.get('data_inicio')
  const dataFim = searchParams.get('data_fim')

  let query = db()
    .from('checklist_respostas')
    .select('id, resposta, observacao, created_at, item_id, checklist_futuro_id')
    .in('checklist_futuro_id', checklistIds)
    .order('created_at', { ascending: false })

  if (dataInicio) query = query.gte('created_at', dataInicio)
  if (dataFim) query = query.lte('created_at', dataFim + 'T23:59:59')

  const { data: respostasRaw, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (!respostasRaw || respostasRaw.length === 0) {
    return NextResponse.json({ empresas: empresas || [], respostas: [] })
  }

  // 5. Itens dos checklists
  const itemIds = [...new Set(respostasRaw.map((r: any) => r.item_id))]
  const { data: itens } = await db()
    .from('checklist_futuro_itens')
    .select('id, titulo')
    .in('id', itemIds)

  // 6. Colaboradores
  const colaboradorIds = [...new Set(
    (checklists || []).filter((c: any) => c.colaborador_id).map((c: any) => c.colaborador_id)
  )]
  const { data: colaboradores } = colaboradorIds.length > 0
    ? await db().from('colaboradores').select('id, nome').in('id', colaboradorIds)
    : { data: [] }

  // 7. Montar mapas
  const itensMap = Object.fromEntries((itens || []).map((i: any) => [i.id, i]))
  const checklistsMap = Object.fromEntries((checklists || []).map((c: any) => [c.id, c]))
  const empresasMap = Object.fromEntries((empresas || []).map((e: any) => [e.id, e]))
  const colaboradoresMap = Object.fromEntries((colaboradores || []).map((c: any) => [c.id, c]))

  // 8. Mapear e filtrar resultado
  const resultado = searchParams.get('resultado')

  let respostasMapeadas = respostasRaw.map((r: any) => {
    const checklist = checklistsMap[r.checklist_futuro_id]
    const item = itensMap[r.item_id]
    const empresa = checklist ? empresasMap[checklist.empresa_id] : null
    const colaborador = checklist?.colaborador_id ? colaboradoresMap[checklist.colaborador_id] : null

    const resultadoMapeado: string =
      r.resposta === 'sim' ? 'conforme' :
      r.resposta === 'nao' ? 'nao_conforme' : 'na'

    const dt = new Date(r.created_at)
    const dataFormatada = dt.toLocaleDateString('pt-BR') + ' ' +
      dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

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
    respostasMapeadas = respostasMapeadas.filter((r: any) => r.resultado === resultado)
  }

  return NextResponse.json({ empresas: empresas || [], respostas: respostasMapeadas })
}
