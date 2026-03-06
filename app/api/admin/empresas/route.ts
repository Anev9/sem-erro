import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// GET → lista todas as empresas (para seleção no formulário de colaborador)
export async function GET() {
  const { data, error } = await db()
    .from('empresas')
    .select('id, nome_fantasia, aluno_id')
    .order('nome_fantasia')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}
