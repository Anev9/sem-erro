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

// POST body: { checklist_futuro_id, usuario_id, empresa_id, notificar_ao_criar, notificar_ao_finalizar, notificar_problemas_criticos }
export async function POST(request: NextRequest) {
  const alunoId = getAlunoId(request)
  if (!alunoId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await request.json()
  const {
    checklist_futuro_id,
    usuario_id,
    empresa_id,
    notificar_ao_criar,
    notificar_ao_finalizar,
    notificar_problemas_criticos
  } = body

  if (!checklist_futuro_id || !usuario_id || !empresa_id) {
    return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
  }

  const supabase = db()

  // Verificar se a empresa pertence ao aluno autenticado
  const { data: empresa } = await supabase
    .from('empresas')
    .select('id')
    .eq('id', empresa_id)
    .eq('aluno_id', alunoId)
    .single()

  if (!empresa) return NextResponse.json({ error: 'Sem permissão para esta empresa' }, { status: 403 })

  // Verificar se o checklist e o colaborador pertencem à mesma empresa
  const [{ data: checklist }, { data: colaborador }] = await Promise.all([
    supabase.from('checklists_futuros').select('id').eq('id', checklist_futuro_id).eq('empresa_id', empresa_id).single(),
    supabase.from('colaboradores').select('id').eq('id', usuario_id).eq('empresa_id', empresa_id).single()
  ])

  if (!checklist) return NextResponse.json({ error: 'Checklist não encontrado nesta empresa' }, { status: 404 })
  if (!colaborador) return NextResponse.json({ error: 'Colaborador não encontrado nesta empresa' }, { status: 404 })

  const { data, error } = await supabase
    .from('alertas_adicionais')
    .insert([{
      checklist_futuro_id,
      usuario_id,
      empresa_id,
      notificar_ao_criar: !!notificar_ao_criar,
      notificar_ao_finalizar: !!notificar_ao_finalizar,
      notificar_problemas_criticos: !!notificar_problemas_criticos
    }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
