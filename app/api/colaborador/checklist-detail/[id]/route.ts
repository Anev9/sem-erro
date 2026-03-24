import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: checklistId } = await params
  const { searchParams } = new URL(request.url)
  const colaboradorId = searchParams.get('colaborador_id')

  if (!colaboradorId) {
    return NextResponse.json({ error: 'colaborador_id é obrigatório' }, { status: 400 })
  }

  const supabase = db()

  const { data: checklist, error: checklistError } = await supabase
    .from('checklists_futuros')
    .select('*, empresas(nome_fantasia)')
    .eq('id', checklistId)
    .single()

  if (checklistError || !checklist) {
    return NextResponse.json({ error: 'Checklist não encontrado' }, { status: 404 })
  }

  if (checklist.colaborador_id !== colaboradorId) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const { data: itens, error: itensError } = await supabase
    .from('checklist_futuro_itens')
    .select('*')
    .eq('checklist_futuro_id', checklistId)
    .order('ordem')

  if (itensError) {
    return NextResponse.json({ error: itensError.message }, { status: 500 })
  }

  const { data: respostas } = await supabase
    .from('checklist_respostas')
    .select('*')
    .eq('checklist_futuro_id', checklistId)
    .eq('colaborador_id', colaboradorId)

  return NextResponse.json({
    checklist,
    itens: itens || [],
    respostas: respostas || [],
  })
}
