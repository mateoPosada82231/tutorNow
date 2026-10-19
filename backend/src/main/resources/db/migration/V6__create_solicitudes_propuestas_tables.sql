CREATE TABLE solicitudes_asesoria (
    id BIGSERIAL PRIMARY KEY,
    estudiante_id BIGINT NOT NULL REFERENCES usuarios(id),
    materia_id BIGINT NOT NULL REFERENCES materias(id),
    tema VARCHAR(120) NOT NULL,
    modalidad VARCHAR(20) NOT NULL,
    disponibilidad VARCHAR(300) NOT NULL,
    descripcion TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'PUBLICADA',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_solicitudes_modalidad CHECK (modalidad IN ('VIRTUAL', 'PRESENCIAL')),
    CONSTRAINT chk_solicitudes_estado CHECK (estado IN ('PUBLICADA', 'EN_PROCESO', 'CONFIRMADA', 'CANCELADA'))
);

CREATE INDEX idx_solicitudes_estudiante ON solicitudes_asesoria(estudiante_id);
CREATE INDEX idx_solicitudes_materia ON solicitudes_asesoria(materia_id);
CREATE INDEX idx_solicitudes_estado ON solicitudes_asesoria(estado);

CREATE TABLE propuestas (
    id BIGSERIAL PRIMARY KEY,
    solicitud_id BIGINT NOT NULL REFERENCES solicitudes_asesoria(id),
    tutor_id BIGINT NOT NULL REFERENCES tutores(id),
    mensaje VARCHAR(500) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uniq_propuesta_solicitud_tutor UNIQUE (solicitud_id, tutor_id),
    CONSTRAINT chk_propuestas_estado CHECK (estado IN ('PENDIENTE', 'ACEPTADA', 'RECHAZADA'))
);

CREATE INDEX idx_propuestas_solicitud ON propuestas(solicitud_id);
CREATE INDEX idx_propuestas_tutor ON propuestas(tutor_id);
