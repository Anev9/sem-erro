-- Prazo e notificação de checklist
-- Adiciona campo prazo_alerta a checklists_futuros

ALTER TABLE checklists_futuros
  ADD COLUMN IF NOT EXISTS prazo_alerta date;
