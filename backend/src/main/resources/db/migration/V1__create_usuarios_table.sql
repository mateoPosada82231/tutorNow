CREATE TABLE usuarios (
    id BIGSERIAL PRIMARY KEY,
    correo_electronico VARCHAR(255) NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(200) NOT NULL,
    programa VARCHAR(100),
    semestre INTEGER,
    rol VARCHAR(20) NOT NULL DEFAULT 'ESTUDIANTE',
    verificado BOOLEAN NOT NULL DEFAULT FALSE,
    verification_token VARCHAR(255),
    token_expiracion TIMESTAMP WITH TIME ZONE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uniq_usuarios_correo UNIQUE (correo_electronico)
);

CREATE INDEX idx_usuarios_correo ON usuarios(correo_electronico);
CREATE INDEX idx_usuarios_verification_token ON usuarios(verification_token);
