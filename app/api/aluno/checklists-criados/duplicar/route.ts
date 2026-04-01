import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST /api/aluno/checklists-criados/duplicar
// body: { checklist_id: string }
export async function POST(request: NextRequest) {
  const alunoId = request.cookies.get('sem-erro-aluno-id')?.value
  if (!alunoId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await request.json()
  const { checklist_id } = body
  if (!checklist_id) return NextResponse.json({ error: 'checklist_id obrigatório' }, { status: 400 })

  const supabase = db()

  // Verificar ownership via empresas do aluno
  const { data: empresas } = await supabase
    .from('empresas')
    .select('id')
    .eq('aluno_id', alunoId)

  const empresaIds = (empresas || []).map((e: { id: string }) => e.id)
  if (empresaIds.length === 0) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { data: original, error: clError } = await supabase
    .from('checklists_futuros')
    .select('*')
    .eq('id', checklist_id)
    .in('empresa_id', empresaIds)
    .single()

  if (clError || !original) return NextResponse.json({ error: 'Checklist não encontrado' }, { status: 404 })

  // Buscar itens do checklist original
  const { data: itens } = await supabase
    .from('checklist_futuro_itens')
    .select('titulo, descricao, ordem')
    .eq('checklist_futuro_id', checklist_id)
    .order('ordem')

  // Criar novo checklist como cópia
  const { id: _id, created_at: _ca, updated_at: _ua, ...resto } = original
  const { data: novo, error: insertError } = await supabase
    .from('checklists_futuros')
    .insert([{
      ...resto,
      titulo: `Cópia de ${original.titulo}`,
      status: 'pendente',
    }])
    .select()
    .single()

  if (insertError || !novo) return NextResponse.json({ error: insertError?.message || 'Erro ao duplicar' }, { status: 500 })

  // Duplicar itens
  if (itens && itens.length > 0) {
    const novosItens = itens.map((item: { titulo: string; descricao: string | null; ordem: number }) => ({
      checklist_futuro_id: novo.id,
      titulo: item.titulo,
      descricao: item.descricao,
      ordem: item.ordem,
    }))
    await supabase.from('checklist_futuro_itens').insert(novosItens)
  }

  return NextResponse.json({ id: novo.id, titulo: novo.titulo })
}
