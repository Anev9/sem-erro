-- Adiciona coluna foto_obrigatoria em checklist_futuro_itens
-- Quando true, o colaborador precisa enviar uma foto antes de responder o item.

ALTER TABLE checklist_futuro_itens
  ADD COLUMN IF NOT EXISTS foto_obrigatoria boolean NOT NULL DEFAULT false;
