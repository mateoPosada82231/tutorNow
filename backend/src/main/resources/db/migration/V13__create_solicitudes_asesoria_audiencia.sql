CREATE TABLE solicitudes_asesoria_audiencia (
    id BIGSERIAL PRIMARY KEY,
    solicitud_id BIGINT NOT NULL REFERENCES solicitudes_asesoria(id) ON DELETE CASCADE,
    tutor_id BIGINT NOT NULL REFERENCES tutores(id) ON DELETE CASCADE,
    UNIQUE (solicitud_id, tutor_id)
);

CREATE INDEX idx_solicitudes_asesoria_audiencia_tutor
    ON solicitudes_asesoria_audiencia (tutor_id);
