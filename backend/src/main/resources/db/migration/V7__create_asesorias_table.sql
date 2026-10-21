CREATE TABLE asesorias (
    id BIGSERIAL PRIMARY KEY,
    solicitud_id BIGINT NOT NULL REFERENCES solicitudes_asesoria(id),
    propuesta_id BIGINT NOT NULL REFERENCES propuestas(id),
    estudiante_id BIGINT NOT NULL REFERENCES usuarios(id),
    tutor_id BIGINT NOT NULL REFERENCES tutores(id),
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uniq_asesoria_solicitud UNIQUE (solicitud_id),
    CONSTRAINT uniq_asesoria_propuesta UNIQUE (propuesta_id),
    CONSTRAINT chk_asesorias_estado CHECK (estado IN ('PENDIENTE'))
);

CREATE INDEX idx_asesorias_estudiante ON asesorias(estudiante_id);
CREATE INDEX idx_asesorias_tutor ON asesorias(tutor_id);
CREATE INDEX idx_asesorias_estado ON asesorias(estado);
