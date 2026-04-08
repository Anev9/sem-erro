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
  if (!isAdmin(request)) return NextResponse.json({ error: 'Acesso restrito' }, { status: 403 })

  const supabase = db()

  // Últimos 6 meses
  const meses: { label: string; inicio: string; fim: string }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    const inicio = new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
    const fim = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString()
    const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    meses.push({ label, inicio, fim })
  }

  const [clRes, acRes, alunosRes] = await Promise.all([
    supabase.from('checklists_futuros').select('created_at'),
    supabase.from('acoes_corretivas').select('created_at'),
    supabase.from('alunos').select('created_at').neq('tipo', 'admin').eq('ativo', true),
  ])

  const checklists = clRes.data || []
  const acoes = acRes.data || []
  const alunos = alunosRes.data || []

  const dados = meses.map(({ label, inicio, fim }) => {
    const cl = checklists.filter(c => c.created_at >= inicio && c.created_at <= fim).length
    const ac = acoes.filter(a => a.created_at >= inicio && a.created_at <= fim).length
    const al = alunos.filter(a => a.created_at >= inicio && a.created_at <= fim).length
    return { label, checklists: cl, acoes: ac, novosClientes: al }
  })

  return NextResponse.json(dados)
}
