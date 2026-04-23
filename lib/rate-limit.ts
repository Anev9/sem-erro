// Rate limiting simples em memória — por IP
// Limite: 10 tentativas por janela de 15 minutos
const WINDOW_MS = 15 * 60 * 1000 // 15 minutos
const MAX_ATTEMPTS = 10

type RateLimitEntry = { count: number; resetAt: number }
const store = new Map<string, RateLimitEntry>()

export function checkRateLimit(ip: string | null, namespace = 'login'): { allowed: boolean; retryAfterSec: number } {
  // Bloquear requisições sem IP identificável
  if (!ip) return { allowed: false, retryAfterSec: 60 }
  const now = Date.now()
  const key = `${namespace}:${ip}`
  const entry = store.get(key)

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, retryAfterSec: 0 }
  }

  if (entry.count >= MAX_ATTEMPTS) {
    const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000)
    return { allowed: false, retryAfterSec }
  }

  entry.count++
  return { allowed: true, retryAfterSec: 0 }
}

export function getClientIp(request: Request): string | null {
  const headers = request.headers as Headers
  const cf = headers.get('cf-connecting-ip')
  if (cf) return cf.trim()
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return null
}
