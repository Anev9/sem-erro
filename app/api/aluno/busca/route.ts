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

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json({ checklists: [], acoes: [] })

  const supabase = db()

  // Buscar empresas do aluno
  const { data: empresas } = await supabase
    .from('empresas')
    .select('id')
    .eq('aluno_id', alunoId)
    .eq('ativo', true)

  if (!empresas || empresas.length === 0) return NextResponse.json({ checklists: [], acoes: [] })

  const empresaIds = empresas.map((e: { id: string }) => e.id)

  const [clRes, acRes] = await Promise.all([
    supabase
      .from('checklists_futuros')
      .select('id, titulo, empresa_id, created_at, empresas(nome_fantasia)')
      .in('empresa_id', empresaIds)
      .ilike('titulo', `%${q}%`)
      .limit(8),
    supabase
      .from('acoes_corretivas')
      .select('id, titulo, status, prioridade, empresa_id, created_at, empresas(nome_fantasia)')
      .in('empresa_id', empresaIds)
      .ilike('titulo', `%${q}%`)
      .limit(8),
  ])

  return NextResponse.json({
    checklists: clRes.data || [],
    acoes: acRes.data || [],
  })
}
