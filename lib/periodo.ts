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
  const timestamp = new Date(dataIso).getTime()
  if (Number.isNaN(timestamp)) return null
  const local = new Date(timestamp - BRAZIL_OFFSET_MS)
  return local.toISOString().slice(0, 10)
}

export function hojeBrasil(): string {
  return diaBrasil(new Date().toISOString())!
}

// Data (YYYY-MM-DD) da ocorrência do período atual de um checklist recorrente.
// proxima_execucao guarda só a primeira ocorrência; aqui ela é projetada para o
// período corrente (mesmo dia da semana na semana atual, mesmo dia do mês no mês
// atual, ou hoje para diários). Se a primeira ocorrência ainda não chegou, é mantida.
export function ocorrenciaAtual(
  proximaExecucao: string | null | undefined,
  recorrencia: string | null | undefined
): string | null {
  if (!proximaExecucao) return null
  const original = proximaExecucao.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(original)) return proximaExecucao

  const hoje = hojeBrasil()
  const [ah, mh, dh] = hoje.split('-').map(Number)
  const [ao, mo, dO] = original.split('-').map(Number)
  const dataHoje = new Date(Date.UTC(ah, mh - 1, dh))
  const dataOriginal = new Date(Date.UTC(ao, mo - 1, dO))

  if (recorrencia === 'diaria') {
    return original > hoje ? original : hoje
  }
  if (recorrencia === 'semanal') {
    // Semana de domingo a sábado, igual a inicioPeriodo('semanal')
    const inicioSemana = new Date(dataHoje)
    inicioSemana.setUTCDate(dataHoje.getUTCDate() - dataHoje.getUTCDay())
    if (dataOriginal >= inicioSemana) return original
    const ocorrencia = new Date(inicioSemana)
    ocorrencia.setUTCDate(inicioSemana.getUTCDate() + dataOriginal.getUTCDay())
    return ocorrencia.toISOString().slice(0, 10)
  }
  if (recorrencia === 'mensal') {
    if (ao > ah || (ao === ah && mo >= mh)) return original
    // Dia 31 em mês de 30 dias (ou fevereiro) cai no último dia do mês
    const ultimoDia = new Date(Date.UTC(ah, mh, 0)).getUTCDate()
    const dia = Math.min(dO, ultimoDia)
    return `${ah}-${String(mh).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
  }
  return proximaExecucao
}
