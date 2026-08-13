import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { getAlunoId } from '@/lib/auth'

const db = createAdminClient

// GET → lista checklists com empresas/colaboradores do aluno autenticado
export async function GET(request: NextRequest) {
  const alunoId = getAlunoId(request)
  if (!alunoId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

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
