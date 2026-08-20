const BRAZIL_OFFSET_MS = 3 * 60 * 60 * 1000 // UTC-3 em milissegundos

// Calcula o início do período atual (dia/semana/mês) ajustado para o horário
// do Brasil (UTC-3). O servidor roda em UTC; sem esse ajuste, meia-noite em
// UTC seria 21h do dia anterior em Brasília, deslocando os limites de
// checklists diários/semanais/mensais.
export function inicioPeriodo(recorrencia: string | null): string | null {
  const agora = new Date()
  const local = new Date(agora.getTime() - BRAZIL_OFFSET_MS)

  if (recorrencia === 'diaria') {
    local.setUTCHours(0, 0, 0, 0)
    return new Date(local.getTime() + BRAZIL_OFFSET_MS).toISOString()
  }
  if (recorrencia === 'semanal') {
    local.setUTCDate(local.getUTCDate() - local.getUTCDay())
    local.setUTCHours(0, 0, 0, 0)
    return new Date(local.getTime() + BRAZIL_OFFSET_MS).toISOString()
  }
  if (recorrencia === 'mensal') {
    local.setUTCDate(1)
    local.setUTCHours(0, 0, 0, 0)
    return new Date(local.getTime() + BRAZIL_OFFSET_MS).toISOString()
  }
  return null
}

// Retorna a data (YYYY-MM-DD) de um timestamp no fuso do Brasil (UTC-3),
// usada para agrupar respostas de checklists recorrentes por dia.
export function diaBrasil(dataIso: string | null | undefined): string | null {
  if (!dataIso) return null
  const local = new Date(new Date(dataIso).getTime() - BRAZIL_OFFSET_MS)
  return local.toISOString().slice(0, 10)
}

export function hojeBrasil(): string {
  return diaBrasil(new Date().toISOString())!
}
