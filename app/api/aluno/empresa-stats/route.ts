import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function getAlunoId(request: NextRequest): string | null {
  return request.cookies.get('sem-erro-aluno-id')?.value || null
}

export async function GET(request: NextRequest) {
  const alunoId = getAlunoId(request)
  if (!alunoId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const supabase = db()

  // Buscar todas as empresas do aluno
  const { data: empresas, error: empError } = await supabase
    .from('empresas')
    .select('id, nome_fantasia, ativo, created_at')
    .eq('aluno_id', alunoId)
    .order('nome_fantasia')

  if (empError) return NextResponse.json({ error: empError.message }, { status: 500 })
  if (!empresas || empresas.length === 0) return NextResponse.json([])

  const empresaIds = empresas.map((e: { id: string }) => e.id)

  const [checklistsRes, acoesRes] = await Promise.all([
    supabase
      .from('checklists_futuros')
      .select('id, empresa_id, titulo, created_at')
      .in('empresa_id', empresaIds),
    supabase
      .from('acoes_corretivas')
      .select('id, empresa_id, status, prioridade, urgente, prazo, created_at')
      .in('empresa_id', empresaIds),
  ])

  const checklists = checklistsRes.data || []
  const acoes = acoesRes.data || []
  const hoje = new Date().toISOString().split('T')[0]

  const stats = empresas.map((empresa: { id: string; nome_fantasia: string; ativo: boolean; created_at: string }) => {
    const empChecklists = checklists.filter((c: { empresa_id: string }) => c.empresa_id === empresa.id)
    const empAcoes = acoes.filter((a: { empresa_id: string }) => a.empresa_id === empresa.id)

    const acoesAtrasadas = empAcoes.filter(
      (a: { status: string; prazo: string | null }) => a.status !== 'concluida' && a.prazo && a.prazo < hoje
    ).length
    const acoesUrgentes = empAcoes.filter((a: { urgente: boolean; status: string }) => a.urgente && a.status !== 'concluida').length
    const acoesConcluidas = empAcoes.filter((a: { status: string }) => a.status === 'concluida').length
    const acoesAbertas = empAcoes.length - acoesConcluidas

    return {
      ...empresa,
      totalChecklists: empChecklists.length,
      totalAcoes: empAcoes.length,
      acoesConcluidas,
      acoesAbertas,
      acoesAtrasadas,
      acoesUrgentes,
      taxaConclusao: empAcoes.length > 0 ? Math.round((acoesConcluidas / empAcoes.length) * 100) : 0,
    }
  })

  return NextResponse.json(stats)
}
