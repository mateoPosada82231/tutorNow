CREATE TABLE tutor_slots (
    id              BIGSERIAL PRIMARY KEY,
    tutor_id        BIGINT NOT NULL REFERENCES tutores(id),
    dia_semana      VARCHAR(10) NOT NULL,
    hora_inicio     TIME NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uniq_tutor_slots_tutor_dia_hora UNIQUE (tutor_id, dia_semana, hora_inicio),
    CONSTRAINT chk_tutor_slots_dia_semana CHECK (dia_semana IN ('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO')),
    CONSTRAINT chk_tutor_slots_hora_inicio CHECK (hora_inicio BETWEEN TIME '08:00:00' AND TIME '17:00:00')
);

CREATE INDEX idx_tutor_slots_tutor_id ON tutor_slots(tutor_id);
