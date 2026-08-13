import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Cliente com a service role key — bypassa RLS. Só deve ser usado em código
// de servidor (route handlers), nunca importado por componentes 'use client'.
// Centraliza o que antes era recriado manualmente (com opções de auth
// divergentes) em dezenas de arquivos de rota.
//
// Sem generic explícito, o comportamento é idêntico ao createClient(...) sem
// tipagem que a maioria dessas rotas já usava (Database = any por padrão).
// Rotas que já tipavam o client com <Database> continuam podendo fazer
// createAdminClient<Database>() para manter a checagem de tipos.
export function createAdminClient<Database = any>(): SupabaseClient<Database> {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
