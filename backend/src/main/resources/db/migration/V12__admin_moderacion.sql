ALTER TABLE solicitudes_asesoria
    ADD COLUMN estado_moderacion VARCHAR(20) NOT NULL DEFAULT 'VISIBLE';
ALTER TABLE solicitudes_asesoria
    ADD CONSTRAINT chk_solicitudes_moderacion CHECK (estado_moderacion IN ('VISIBLE', 'RETIRADA'));
CREATE INDEX idx_solicitudes_moderacion ON solicitudes_asesoria(estado_moderacion);

ALTER TABLE resenas_asesoria
    ADD COLUMN estado_moderacion VARCHAR(20) NOT NULL DEFAULT 'VISIBLE';
ALTER TABLE resenas_asesoria
    ADD CONSTRAINT chk_resenas_moderacion CHECK (estado_moderacion IN ('VISIBLE', 'RETIRADA'));
CREATE INDEX idx_resenas_moderacion ON resenas_asesoria(estado_moderacion);

CREATE TABLE reportes (
    id BIGSERIAL PRIMARY KEY,
    reportador_id BIGINT NOT NULL REFERENCES usuarios(id),
    tipo VARCHAR(20) NOT NULL,
    target_id BIGINT NOT NULL,
    motivo VARCHAR(120) NOT NULL,
    descripcion VARCHAR(1000),
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    resolucion VARCHAR(500),
    resuelto_por_id BIGINT REFERENCES usuarios(id),
    resuelto_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_reportes_tipo CHECK (tipo IN ('PUBLICACION', 'RESENA', 'USUARIO')),
    CONSTRAINT chk_reportes_estado CHECK (estado IN ('PENDIENTE', 'RESUELTO', 'DESCARTADO')),
    CONSTRAINT chk_reportes_motivo CHECK (char_length(motivo) BETWEEN 3 AND 120),
    CONSTRAINT chk_reportes_descripcion CHECK (
        descripcion IS NULL OR char_length(descripcion) BETWEEN 5 AND 1000),
    CONSTRAINT chk_reportes_resolucion CHECK (
        estado = 'PENDIENTE' OR resolucion IS NOT NULL)
);

CREATE INDEX idx_reportes_reportador ON reportes(reportador_id);
CREATE INDEX idx_reportes_target ON reportes(tipo, target_id);
CREATE INDEX idx_reportes_estado ON reportes(estado);
CREATE INDEX idx_reportes_resuelto_por ON reportes(resuelto_por_id);
