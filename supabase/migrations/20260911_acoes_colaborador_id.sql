alter table acoes_corretivas add column if not exists colaborador_id uuid references colaboradores(id);
