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

// GET → lista os últimos logs com filtros opcionais
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Acesso restrito' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const alunoId = searchParams.get('aluno_id')
  const acao = searchParams.get('acao')
  const dataInicio = searchParams.get('data_inicio')
  const dataFim = searchParams.get('data_fim')
  const limite = Math.min(parseInt(searchParams.get('limite') || '100'), 500)

  const supabase = db()
  let query = supabase
    .from('log_alteracoes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limite)

  if (alunoId) query = query.eq('aluno_id', alunoId)
  if (acao) query = query.eq('acao', acao)
  if (dataInicio) query = query.gte('created_at', dataInicio)
  if (dataFim) query = query.lte('created_at', dataFim + 'T23:59:59')

  const { data, error } = await query

  if (error) {
    if (error.message.includes('does not exist')) return NextResponse.json([])
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data || [])
}

// POST → registra uma alteração
export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Acesso restrito' }, { status: 403 })

  const body = await request.json()
  const { aluno_id, aluno_nome, acao, detalhe } = body

  if (!aluno_id || !acao) return NextResponse.json({ error: 'aluno_id e acao são obrigatórios' }, { status: 400 })

  const supabase = db()
  const { error } = await supabase
    .from('log_alteracoes')
    .insert({ aluno_id, aluno_nome, acao, detalhe })

  // Ignora silenciosamente se a tabela não existir
  if (error && !error.message.includes('does not exist')) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
