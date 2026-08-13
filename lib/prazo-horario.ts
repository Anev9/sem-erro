// Cálculo (client-side) do alerta de prazo por horário de um checklist recorrente,
// ex: "Checklist abertura de loja" com hora_limite "08:00:00".
// Usa o horário local do navegador, que para os usuários deste sistema já é o de Brasília.

export type AlertaHorario = {
  nivel: 'vencido' | 'proximo' | null
  minutosRestantes: number
  horaFormatada: string
}

const MINUTOS_ALERTA_PROXIMO = 45

export function calcularAlertaHorario(
  horaLimite: string | null | undefined,
  minutosAntes: number = MINUTOS_ALERTA_PROXIMO
): AlertaHorario | null {
  if (!horaLimite) return null

  const [h, m] = horaLimite.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null

  const agora = new Date()
  const limite = new Date()
  limite.setHours(h, m, 0, 0)

  const minutosRestantes = Math.round((limite.getTime() - agora.getTime()) / 60000)
  const horaFormatada = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`

  if (minutosRestantes < 0) return { nivel: 'vencido', minutosRestantes, horaFormatada }
  if (minutosRestantes <= minutosAntes) return { nivel: 'proximo', minutosRestantes, horaFormatada }
  return { nivel: null, minutosRestantes, horaFormatada }
}
