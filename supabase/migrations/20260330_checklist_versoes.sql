-- Histórico de versões de checklist
-- Salva um snapshot a cada edição

CREATE TABLE IF NOT EXISTS checklist_versoes (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_id uuid       NOT NULL REFERENCES checklists_futuros(id) ON DELETE CASCADE,
  versao      integer     NOT NULL DEFAULT 1,
  titulo      text        NOT NULL,
  descricao   text,
  itens       jsonb       NOT NULL DEFAULT '[]',
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checklist_versoes_checklist_id ON checklist_versoes(checklist_id);
