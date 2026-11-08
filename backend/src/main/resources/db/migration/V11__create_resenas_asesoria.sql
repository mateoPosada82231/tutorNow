CREATE TABLE resenas_asesoria (
    id BIGSERIAL PRIMARY KEY,
    asesoria_id BIGINT NOT NULL REFERENCES asesorias(id),
    autor_id BIGINT NOT NULL REFERENCES usuarios(id),
    rol_autor VARCHAR(10) NOT NULL,
    rating SMALLINT NOT NULL,
    comentario VARCHAR(500) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uniq_resena_autor_asesoria UNIQUE (asesoria_id, autor_id),
    CONSTRAINT chk_resena_rol CHECK (rol_autor IN ('ESTUDIANTE', 'TUTOR')),
    CONSTRAINT chk_resena_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT chk_resena_comentario CHECK (char_length(comentario) BETWEEN 5 AND 500)
);

CREATE INDEX idx_resenas_asesoria ON resenas_asesoria(asesoria_id);
CREATE INDEX idx_resenas_autor ON resenas_asesoria(autor_id);
