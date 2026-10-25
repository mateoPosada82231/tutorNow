ALTER TABLE asesorias
    ADD COLUMN confirmacion_estudiante_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN confirmacion_tutor_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN finalizada_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE asesorias DROP CONSTRAINT chk_asesorias_estado;
ALTER TABLE asesorias ADD CONSTRAINT chk_asesorias_estado
    CHECK (estado IN ('PENDIENTE', 'FINALIZADA', 'EVALUADA', 'CANCELADA'));
