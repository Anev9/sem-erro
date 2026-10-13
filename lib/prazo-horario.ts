// Cálculo (client-side) do alerta de prazo por horário de um checklist recorrente,
// ex: "Checklist abertura de loja" com hora_limite "08:00:00".
// Usa o horário local do navegador, que para os usuários deste sistema já é o de Brasília.

export type AlertaHorario = {
  nivel: 'vencido' | 'proximo' | null
  minutosRestantes: number
  horaFormatada: string
}

const MINUTOS_ALERTA_PROXIMO = 45

// "2026-10-16" via new Date() é interpretado como meia-noite UTC, que no Brasil (UTC-3)
// vira 15/10 às 21h — por isso a data exibida ficava um dia antes. Aqui montamos a data local.
export function parseDataLocal(dataStr: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dataStr)
  if (!match) return new Date(dataStr)
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

export function formatarDataLocal(dataStr: string | null | undefined): string {
  if (!dataStr) return ''
  return parseDataLocal(dataStr).toLocaleDateString('pt-BR')
}

export function calcularAlertaHorario(
  horaLimite: string | null | undefined,
  minutosAntes: number = MINUTOS_ALERTA_PROXIMO,
  proximaExecucao?: string | null,
  diasTolerancia: number = 0
): AlertaHorario | null {
  if (!horaLimite) return null

  const [h, m] = horaLimite.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null

  // Se a execução ainda não chegou (nem considerando a tolerância), não há prazo "de hoje"
  if (proximaExecucao) {
    const inicioJanela = parseDataLocal(proximaExecucao)
    inicioJanela.setDate(inicioJanela.getDate() - diasTolerancia)
    if (new Date() < inicioJanela) return null
  }

  const agora = new Date()
  const limite = new Date()
  limite.setHours(h, m, 0, 0)

  const minutosRestantes = Math.round((limite.getTime() - agora.getTime()) / 60000)
  const horaFormatada = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`

  if (minutosRestantes < 0) return { nivel: 'vencido', minutosRestantes, horaFormatada }
  if (minutosRestantes <= minutosAntes) return { nivel: 'proximo', minutosRestantes, horaFormatada }
  return { nivel: null, minutosRestantes, horaFormatada }
}
