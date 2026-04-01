-- Comentários nos itens do checklist (visão do gestor)
CREATE TABLE IF NOT EXISTS checklist_item_comentarios (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_id uuid        NOT NULL REFERENCES checklists_futuros(id) ON DELETE CASCADE,
  item_id      uuid        NOT NULL REFERENCES checklist_futuro_itens(id) ON DELETE CASCADE,
  autor        text        NOT NULL DEFAULT 'Gestor',
  texto        text        NOT NULL,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comentarios_checklist ON checklist_item_comentarios(checklist_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_item ON checklist_item_comentarios(item_id);
