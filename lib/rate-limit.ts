// Rate limiting por IP, persistido no Supabase (tabela rate_limits +
// função rate_limit_hit — ver supabase/migrations/20260813_rate_limits.sql).
// Um Map em memória não funciona aqui: cada instância serverless da Vercel
// (e cada cold start) tem seu próprio processo, então um limite em memória
// não é compartilhado entre requisições concorrentes e não protege de fato.
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

const WINDOW_MS = 15 * 60 * 1000 // 15 minutos
const MAX_ATTEMPTS = 10

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function checkRateLimit(ip: string | null, namespace = 'login'): Promise<{ allowed: boolean; retryAfterSec: number }> {
  // Bloquear requisições sem IP identificável
  if (!ip) return { allowed: false, retryAfterSec: 60 }

  const key = `${namespace}:${ip}`
  const { data, error } = await db().rpc('rate_limit_hit', {
    p_key: key,
    p_window_ms: WINDOW_MS,
    p_max: MAX_ATTEMPTS,
  })

  if (error || !data || data.length === 0) {
    // Falha ao consultar o rate limit (ex.: indisponibilidade momentânea do banco).
    // Falha aberta — não deixar o rate limiter derrubar o login de todo mundo —
    // mas registra o erro para investigação.
    logger.error('rate-limit', 'Falha ao consultar rate_limit_hit', error?.message)
    return { allowed: true, retryAfterSec: 0 }
  }

  const row = data[0] as { allowed: boolean; retry_after_sec: number }
  return { allowed: row.allowed, retryAfterSec: row.retry_after_sec }
}

export function getClientIp(request: Request): string | null {
  const headers = request.headers as Headers
  // x-real-ip é definido pela borda da Vercel com o IP real do cliente — não pode
  // ser sobrescrito por um header enviado pelo próprio cliente.
  const realIp = headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  const cf = headers.get('cf-connecting-ip')
  if (cf) return cf.trim()
  // x-forwarded-for pode ter valores injetados pelo cliente antes de chegar ao
  // proxy; o IP confiável é o último da lista, adicionado pelo hop mais próximo
  // do servidor — usar o primeiro (como antes) permite forjar um IP novo a cada
  // requisição e burlar o rate limit.
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    const parts = forwarded.split(',').map((p) => p.trim()).filter(Boolean)
    if (parts.length > 0) return parts[parts.length - 1]
  }
  return null
}
