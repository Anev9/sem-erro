create table if not exists alertas_adicionais (
  id                             uuid primary key default gen_random_uuid(),
  checklist_futuro_id            uuid not null references checklists_futuros(id) on delete cascade,
  usuario_id                     uuid not null references colaboradores(id) on delete cascade,
  empresa_id                     uuid not null references empresas(id) on delete cascade,
  notificar_ao_criar             boolean not null default false,
  notificar_ao_finalizar         boolean not null default false,
  notificar_problemas_criticos   boolean not null default false,
  created_at                     timestamptz not null default now()
);

create index if not exists alertas_adicionais_empresa_idx   on alertas_adicionais (empresa_id);
create index if not exists alertas_adicionais_checklist_idx on alertas_adicionais (checklist_futuro_id);
