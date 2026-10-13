-- Vários colaboradores responsáveis por um mesmo checklist (ex: gerentes que atuam em várias lojas).
-- colaborador_id continua existindo e guarda o primeiro responsável, para compatibilidade
-- com relatórios e alertas que ainda leem só um colaborador.

ALTER TABLE checklists_futuros
  ADD COLUMN IF NOT EXISTS colaborador_ids uuid[] NOT NULL DEFAULT '{}';

UPDATE checklists_futuros
  SET colaborador_ids = ARRAY[colaborador_id]
  WHERE colaborador_id IS NOT NULL AND colaborador_ids = '{}';

CREATE INDEX IF NOT EXISTS idx_checklists_futuros_colaborador_ids
  ON checklists_futuros USING gin (colaborador_ids);
