import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/aluno/feed — retorna as últimas atividades do aluno
export async function GET(request: NextRequest) {
  const alunoId = request.cookies.get('sem-erro-aluno-id')?.value
  if (!alunoId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const supabase = db()

  // Buscar empresas do aluno
  const { data: empresas } = await supabase
    .from('empresas')
    .select('id, nome_fantasia')
    .eq('aluno_id', alunoId)

  const empresaIds = (empresas || []).map((e: { id: string }) => e.id)
  if (empresaIds.length === 0) return NextResponse.json([])

  // Buscar checklists recentes criados/atualizados
  const { data: checklistsRecentes } = await supabase
    .from('checklists_futuros')
    .select('id, titulo, status, created_at, empresa_id, empresas(nome_fantasia)')
    .in('empresa_id', empresaIds)
    .order('created_at', { ascending: false })
    .limit(10)

  // Buscar respostas recentes
  const { data: respostasRecentes } = await supabase
    .from('checklist_respostas')
    .select('id, created_at, checklist_futuro_id, colaboradores(nome), checklists_futuros!inner(titulo, empresa_id)')
    .in('checklists_futuros.empresa_id', empresaIds)
    .order('created_at', { ascending: false })
    .limit(10)

  // Buscar ações corretivas recentes
  const { data: acoesRecentes } = await supabase
    .from('acoes_corretivas')
    .select('id, titulo, status, created_at, checklist_id, checklists_futuros!inner(empresa_id, titulo)')
    .in('checklists_futuros.empresa_id', empresaIds)
    .order('created_at', { ascending: false })
    .limit(5)

  // Montar feed
  const feed: Array<{ tipo: string; descricao: string; data: string; checklist?: string }> = []

  for (const cl of (checklistsRecentes || [])) {
    const empresa = (cl.empresas as { nome_fantasia: string } | null)?.nome_fantasia || ''
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
