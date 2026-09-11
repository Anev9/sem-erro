import type { SupabaseClient } from '@supabase/supabase-js'

interface NotificarResponsavelParams {
  db: SupabaseClient<any>
  colaboradorId: string | null | undefined
  titulo: string
  empresaNome?: string | null
  prazo?: string | null
  urgente?: boolean
}

// Dispara um webhook para o n8n com os dados da ação, que se encarrega de
// enviar a mensagem via WhatsApp (Datafy). Sem N8N_ACOES_WEBHOOK_URL configurada,
// ou sem colaborador/telefone, a notificação é silenciosamente ignorada — nunca
// deve impedir a criação/edição da ação em si.
export async function notificarResponsavelWhatsapp({ db, colaboradorId, titulo, empresaNome, prazo, urgente }: NotificarResponsavelParams) {
  const webhookUrl = process.env.N8N_ACOES_WEBHOOK_URL
  if (!webhookUrl || !colaboradorId) return

  try {
    const { data: colaborador } = await db
      .from('colaboradores')
      .select('nome, celular, telefone')
      .eq('id', colaboradorId)
      .single()

    const telefone = colaborador?.celular || colaborador?.telefone
    if (!colaborador || !telefone) return

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://performeseumercado.com.br'

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        evento: 'acao_atribuida',
        colaborador: colaborador.nome,
        telefone,
        titulo,
        empresa: empresaNome || null,
        prazo: prazo || null,
        urgente: !!urgente,
        link: `${appUrl}/acoes`,
      }),
    })
  } catch (err) {
    console.error('Erro ao notificar responsável via WhatsApp:', err)
  }
}
