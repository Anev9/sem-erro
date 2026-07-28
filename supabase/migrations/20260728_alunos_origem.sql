alter table alunos add column if not exists origem text not null default 'programa';

alter table alunos drop constraint if exists alunos_origem_check;
alter table alunos add constraint alunos_origem_check check (origem in ('pagante', 'programa'));

-- Backfill: quem tem uma venda paga confirmada no Asaas é pagante; os demais ficam como programa.
update alunos
set origem = 'pagante'
where lower("e-mail") in (
  select lower(email) from vendas_pendentes where processado = true
);
