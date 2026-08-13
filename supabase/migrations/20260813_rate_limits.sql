-- Rate limiting persistente por IP, compartilhado entre instâncias serverless.
-- Substitui o Map em memória de lib/rate-limit.ts, que não é compartilhado
-- entre lambdas/cold starts na Vercel e por isso não protegia de verdade
-- contra brute force distribuído.

create table if not exists rate_limits (
  key text primary key,
  count integer not null default 1,
  reset_at timestamptz not null
);

-- Incrementa (ou reinicia, se a janela expirou) o contador de forma atômica
-- via upsert com ON CONFLICT, evitando condição de corrida entre requisições
-- concorrentes na mesma chave.
create or replace function rate_limit_hit(p_key text, p_window_ms bigint, p_max int)
returns table(allowed boolean, retry_after_sec int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_count int;
  v_reset_at timestamptz;
begin
  insert into rate_limits as rl (key, count, reset_at)
  values (p_key, 1, v_now + (p_window_ms || ' milliseconds')::interval)
  on conflict (key) do update
    set count = case when rl.reset_at <= v_now then 1 else rl.count + 1 end,
        reset_at = case when rl.reset_at <= v_now then v_now + (p_window_ms || ' milliseconds')::interval else rl.reset_at end
  returning rl.count, rl.reset_at into v_count, v_reset_at;

  if v_count > p_max then
    return query select false, greatest(1, ceil(extract(epoch from (v_reset_at - v_now)))::int);
  else
    return query select true, 0;
  end if;
end;
$$;

-- Só o backend (service role) deve poder chamar isso — nunca o cliente.
revoke execute on function rate_limit_hit(text, bigint, int) from public, anon, authenticated;
