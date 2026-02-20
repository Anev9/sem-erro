import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const alunoId = searchParams.get('aluno_id')
  const dataInicio = searchParams.get('data_inicio')
  const dataFim = searchParams.get('data_fim')
  const empresaId = searchParams.get('empresa_id')
  const cargo = searchParams.get('cargo')

  if (!alunoId || !dataInicio || !dataFim) {
    return NextResponse.json({ error: 'Parâmetros obrigatórios ausentes' }, { status: 400 })
  }

  const supabase = db()
  const vazio = { departamentos: [], totais: { totalRespostas: 0, conformes: 0, naoConformes: 0, taxaMedia: 0 } }

  // Buscar empresas do aluno
  let empresasQuery = supabase.from('empresas').select('id').eq('aluno_id', alunoId)
  if (empresaId) empresasQuery = empresasQuery.eq('id', empresaId)
  const { data: empresas } = await empresasQuery

  const empresaIds = (empresas || []).map((e: any) => e.id)
  if (empresaIds.length === 0) return NextResponse.json(vazio)

  // Buscar colaboradores dessas empresas
  let colabQuery = supabase
    .from('colaboradores')
    .select('id, cargo')
    .in('empresa_id', empresaIds)
    .eq('ativo', true)
  if (cargo) colabQuery = colabQuery.eq('cargo', cargo)
  const { data: colaboradores } = await colabQuery

  const colaboradorIds = (colaboradores || []).map((c: any) => c.id)
  if (colaboradorIds.length === 0) return NextResponse.json(vazio)

  // Mapa colaborador_id → cargo
  const cargoMap: Record<string, string> = {}
  ;(colaboradores || []).forEach((c: any) => { cargoMap[c.id] = c.cargo })

  // Buscar respostas no período
  const { data: respostas, error } = await supabase
    .from('checklist_respostas')
    .select('resposta, colaborador_id')
    .in('colaborador_id', colaboradorIds)
    .gte('created_at', `${dataInicio}T00:00:00`)
    .lte('created_at', `${dataFim}T23:59:59`)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!respostas || respostas.length === 0) return NextResponse.json(vazio)

  // Agrupar por cargo
  const grupos: Record<string, { conformes: number; naoConformes: number; naAplicavel: number; total: number }> = {}

  respostas.forEach((r: any) => {
    const dep = cargoMap[r.colaborador_id] || 'Sem cargo'
    if (!grupos[dep]) grupos[dep] = { conformes: 0, naoConformes: 0, naAplicavel: 0, total: 0 }
    grupos[dep].total++
    if (r.resposta === 'sim') grupos[dep].conformes++
    else if (r.resposta === 'nao') grupos[dep].naoConformes++
    else if (r.resposta === 'na') grupos[dep].naAplicavel++
  })

  const departamentos = Object.entries(grupos)
    .map(([departamento, d]) => ({
      departamento,
      totalRespostas: d.total,
      conformes: d.conformes,
      naoConformes: d.naoConformes,
      naAplicavel: d.naAplicavel,
      taxa: d.total > 0 ? Math.round((d.conformes / d.total) * 100) : 0
    }))
    .sort((a, b) => b.taxa - a.taxa)

  const totalRespostas = departamentos.reduce((acc, d) => acc + d.totalRespostas, 0)
  const conformes = departamentos.reduce((acc, d) => acc + d.conformes, 0)
  const naoConformes = departamentos.reduce((acc, d) => acc + d.naoConformes, 0)
  const taxaMedia = totalRespostas > 0 ? Math.round((conformes / totalRespostas) * 100) : 0

  return NextResponse.json({
    departamentos,
    totais: { totalRespostas, conformes, naoConformes, taxaMedia }
  })
}
