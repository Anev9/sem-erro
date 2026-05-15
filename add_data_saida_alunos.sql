-- Adiciona a coluna data_saida na tabela alunos
-- Execute este script no Supabase Dashboard > SQL Editor

ALTER TABLE alunos
  ADD COLUMN IF NOT EXISTS data_saida DATE NULL;

COMMENT ON COLUMN alunos.data_saida IS 'Data em que o cliente encerrou o uso do app';
