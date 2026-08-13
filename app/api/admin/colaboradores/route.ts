import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase-admin'

const db = createAdminClient


// GET → lista todos os colaboradores de todas as empresas
export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Acesso restrito a administradores' }, { status: 403 })
  }

  const { data, error } = await db()
    .from('colaboradores')
    .select('*, empresas(nome_fantasia)')
    .order('nome')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}
