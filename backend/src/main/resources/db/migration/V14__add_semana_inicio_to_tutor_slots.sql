ALTER TABLE tutor_slots ADD COLUMN semana_inicio DATE;

-- Existing slots are recurring: assign them to the current week (Monday of today).
-- Weeks +1 and +2 for those tutors start empty.
UPDATE tutor_slots
SET semana_inicio = date_trunc('week', CURRENT_DATE)::date;

ALTER TABLE tutor_slots ALTER COLUMN semana_inicio SET NOT NULL;

ALTER TABLE tutor_slots DROP CONSTRAINT uniq_tutor_slots_tutor_dia_hora;
ALTER TABLE tutor_slots
    ADD CONSTRAINT uniq_tutor_slots_tutor_semana_dia_hora UNIQUE (tutor_id, semana_inicio, dia_semana, hora_inicio);

CREATE INDEX idx_tutor_slots_tutor_semana ON tutor_slots(tutor_id, semana_inicio);
