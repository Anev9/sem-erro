alter table alunos
  add column if not exists senha_temporaria boolean not null default false;
