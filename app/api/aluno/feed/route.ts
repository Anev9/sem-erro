import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { getAlunoId } from '@/lib/auth'

const db = createAdminClient

// GET /api/aluno/feed — retorna as últimas atividades do aluno
export async function GET(request: NextRequest) {
  const alunoId = getAlunoId(request)
  if (!alunoId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const supabase = db()

  // Buscar empresas do aluno
  const { data: empresas } = await supabase
    .from('empresas')
    .select('id, nome_fantasia')
    .eq('aluno_id', alunoId)

  const empresaIds = (empresas || []).map((e: { id: string }) => e.id)
  if (empresaIds.length === 0) return NextResponse.json([])

  // Checklists e ações recentes são independentes entre si — buscar em paralelo
  const [{ data: checklistsRecentes }, { data: acoesRecentes }] = await Promise.all([
    supabase
      .from('checklists_futuros')
      .select('id, titulo, status, created_at, empresa_id, empresas(nome_fantasia)')
      .in('empresa_id', empresaIds)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('acoes_corretivas')
      .select('id, titulo, status, created_at, checklist_id, checklists_futuros!inner(empresa_id, titulo)')
      .in('checklists_futuros.empresa_id', empresaIds)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  // Montar feed
  const feed: Array<{ tipo: string; descricao: string; data: string; checklist?: string }> = []

  for (const cl of (checklistsRecentes || [])) {
    const empresaRel = cl.empresas as { nome_fantasia: string }[] | { nome_fantasia: string } | null
    const empresa = (Array.isArray(empresaRel) ? empresaRel[0]?.nome_fantasia : empresaRel?.nome_fantasia) || ''
    feed.push({
      tipo: 'checklist',
      descricao: `Checklist "${cl.titulo}" criado${empresa ? ` para ${empresa}` : ''}`,
      data: cl.created_at,
      checklist: cl.id,
    })
  }

  for (const ac of (acoesRecentes || [])) {
    feed.push({
      tipo: 'acao',
      descricao: `Ação corretiva "${ac.titulo}" com status ${ac.status}`,
      data: ac.created_at,
    })
  }

  // Ordenar por data decrescente e limitar a 15
  feed.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
  return NextResponse.json(feed.slice(0, 15))
}
