import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function isAdmin(request: NextRequest): boolean {
  return !!request.cookies.get('sem-erro-admin')?.value
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Acesso restrito' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const alunoId = searchParams.get('aluno_id')
  if (!alunoId) return NextResponse.json({ error: 'aluno_id obrigatório' }, { status: 400 })

  const supabase = db()

  const { data: empresas } = await supabase
    .from('empresas')
    .select('id, nome_fantasia')
    .eq('aluno_id', alunoId)

  if (!empresas || empresas.length === 0) return NextResponse.json([])

  const empresaIds = empresas.map(e => e.id)
  const empMap: Record<string, string> = {}
  for (const e of empresas) empMap[e.id] = e.nome_fantasia

  const ha30 = new Date()
  ha30.setDate(ha30.getDate() - 30)
  const desde = ha30.toISOString()

  const [clRes, acRes] = await Promise.all([
    supabase
      .from('checklists_futuros')
      .select('id, titulo, status, updated_at, empresa_id')
      .in('empresa_id', empresaIds)
      .gte('updated_at', desde)
      .order('updated_at', { ascending: false })
      .limit(15),
    supabase
      .from('acoes_corretivas')
      .select('id, titulo, status, created_at, empresa_id')
      .in('empresa_id', empresaIds)
      .gte('created_at', desde)
      .order('created_at', { ascending: false })
      .limit(15),
  ])

  const lista: { tipo: string; descricao: string; data: string; empresa?: string }[] = []

  for (const cl of clRes.data || []) {
    const statusTexto = cl.status === 'concluido' ? 'concluído' : cl.status === 'em_andamento' ? 'em andamento' : 'pendente'
    lista.push({ tipo: 'checklist', descricao: `Checklist "${cl.titulo}" — ${statusTexto}`, data: cl.updated_at, empresa: empMap[cl.empresa_id] })
  }
  for (const ac of acRes.data || []) {
    lista.push({ tipo: 'acao', descricao: `Ação "${ac.titulo}" — ${ac.status}`, data: ac.created_at, empresa: empMap[ac.empresa_id] })
  }

  lista.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

  return NextResponse.json(lista.slice(0, 20))
}
