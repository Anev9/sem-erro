-- Prazo por horário do dia para responder o checklist (ex: até 08:00 - "abertura de loja")
-- e alerta por e-mail quando o horário limite estiver próximo

ALTER TABLE checklists_futuros
  ADD COLUMN IF NOT EXISTS hora_limite time;

-- Data (America/Sao_Paulo) do último alerta de "prazo próximo" já enviado por e-mail para este
-- checklist, usada para não reenviar o mesmo alerta várias vezes no mesmo dia
ALTER TABLE checklists_futuros
  ADD COLUMN IF NOT EXISTS ultimo_alerta_prazo_enviado_em date;

ALTER TABLE alertas_adicionais
  ADD COLUMN IF NOT EXISTS notificar_prazo_proximo boolean NOT NULL DEFAULT false;
