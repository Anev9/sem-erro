create table if not exists vendas_pendentes (
  id                    uuid primary key default gen_random_uuid(),
  asaas_payment_id      text unique not null,
  bomcontrole_venda_id  text,
  nome                  text not null,
  email                 text not null,
  telefone              text,
  nome_empresa          text,
  plano                 text not null,
  processado            boolean not null default false,
  created_at            timestamptz not null default now()
);

create index if not exists vendas_pendentes_payment_idx on vendas_pendentes (asaas_payment_id);
create index if not exists vendas_pendentes_email_idx   on vendas_pendentes (email);
