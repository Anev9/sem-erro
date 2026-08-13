import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase-admin'

const db = createAdminClient


// GET → lista todas as empresas (para seleção no formulário de colaborador)
export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Acesso restrito a administradores' }, { status: 403 })
  }

  const { data, error } = await db()
    .from('empresas')
    .select('id, nome_fantasia, aluno_id')
    .order('nome_fantasia')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}
