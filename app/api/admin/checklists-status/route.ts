import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

function db() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function isAdmin(request: NextRequest): boolean {
  return !!request.cookies.get('sem-erro-admin')?.value
}

type Aluno = Pick<Database['public']['Tables']['alunos']['Row'], 'id' | 'clientes'>
type Empresa = Pick<Database['public']['Tables']['empresas']['Row'], 'id' | 'nome_fantasia' | 'aluno_id'>
type Checklist = Pick<Database['public']['Tables']['checklists_futuros']['Row'],
  'id' | 'titulo' | 'nome' | 'status' | 'progresso_percentual' | 'empresa_id' |
  'colaborador_id' | 'concluido_por' | 'concluido_em' | 'proxima_execucao' |
  'data_inicio' | 'data_fim' | 'created_at' | 'updated_at'>
type Colaborador = Pick<Database['public']['Tables']['colaboradores']['Row'], 'id' | 'nome'>

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Acesso restrito a administradores' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const alunoIdFiltro = searchParams.get('aluno_id')
  const statusFiltro = searchParams.get('status')

  const supabase = db()

  const { data: alunosData } = await supabase
    .from('alunos')
    .select('id, clientes')
    .neq('tipo', 'admin')
    .order('clientes')
  const alunos = (alunosData as Aluno[]) || []

  const { data: empresasData } = await supabase
    .from('empresas')
    .select('id, nome_fantasia, aluno_id')
  const empresas = (empresasData as Empresa[]) || []

  let empresaIdsFiltro: string[] | null = null
  if (alunoIdFiltro) {
    empresaIdsFiltro = empresas.filter((e) => String(e.aluno_id) === alunoIdFiltro).map((e) => e.id)
  }

  let checklistsQuery = supabase
    .from('checklists_futuros')
    .select('id, titulo, nome, status, progresso_percentual, empresa_id, colaborador_id, concluido_por, concluido_em, proxima_execucao, data_inicio, data_fim, created_at, updated_at')
    .order('updated_at', { ascending: false })

  if (empresaIdsFiltro) checklistsQuery = checklistsQuery.in('empresa_id', empresaIdsFiltro)
  if (statusFiltro && statusFiltro !== 'todos') checklistsQuery = checklistsQuery.eq('status', statusFiltro)

  const { data: checklistsData, error } = await checklistsQuery
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const checklists = (checklistsData as Checklist[]) || []

  const colaboradorIds = [...new Set(
    checklists.flatMap((c) => [c.colaborador_id, c.concluido_por]).filter((id): id is string => !!id)
  )]
  const { data: colaboradoresData } = colaboradorIds.length > 0
    ? await supabase.from('colaboradores').select('id, nome').in('id', colaboradorIds)
    : { data: [] as Colaborador[] }
  const colaboradores = (colaboradoresData as Colaborador[]) || []

  const alunosMap = Object.fromEntries(alunos.map((a) => [a.id, a]))
  const empresasMap = Object.fromEntries(empresas.map((e) => [e.id, e]))
  const colaboradoresMap = Object.fromEntries(colaboradores.map((c) => [c.id, c.nome]))

  const resultado = checklists.map((c) => {
    const empresa = c.empresa_id ? empresasMap[c.empresa_id] : null
    const aluno = empresa?.aluno_id ? alunosMap[empresa.aluno_id] : null

    return {
      id: c.id,
      titulo: c.titulo || c.nome,
      status: c.status || 'pendente',
      progresso: c.progresso_percentual ?? 0,
      empresa_id: empresa?.id || null,
      empresa_nome: empresa?.nome_fantasia || 'Desconhecida',
      aluno_id: aluno?.id ?? null,
      aluno_nome: aluno?.clientes || 'Desconhecido',
      colaborador_nome: c.colaborador_id ? (colaboradoresMap[c.colaborador_id] || '-') : '-',
      concluido_por_nome: c.concluido_por ? (colaboradoresMap[c.concluido_por] || '-') : null,
      concluido_em: c.concluido_em,
      proxima_execucao: c.proxima_execucao,
      data_inicio: c.data_inicio,
      data_fim: c.data_fim,
      updated_at: c.updated_at,
    }
  })

  return NextResponse.json({
    alunos: alunos.map((a) => ({ id: a.id, nome: a.clientes })),
    checklists: resultado,
  })
}
