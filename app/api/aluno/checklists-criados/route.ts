import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET ?aluno_id=X  → lista checklists com empresas/colaboradores
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const alunoId = searchParams.get('aluno_id')
  if (!alunoId) return NextResponse.json({ error: 'aluno_id obrigatório' }, { status: 400 })

  const { data: empresas } = await db()
    .from('empresas')
    .select('id, nome_fantasia')
    .eq('aluno_id', alunoId)

  const empresaIds = (empresas || []).map((e: any) => e.id)
  if (empresaIds.length === 0) return NextResponse.json({ empresas: [], checklists: [] })

  const { data, error } = await db()
    .from('checklists_futuros')
    .select('*, empresas(nome_fantasia), colaboradores(nome)')
    .in('empresa_id', empresaIds)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ empresas: empresas || [], checklists: data || [] })
}
