ALTER TABLE usuarios ADD COLUMN reset_token VARCHAR(255);
ALTER TABLE usuarios ADD COLUMN reset_token_expiracion TIMESTAMP WITH TIME ZONE;
ALTER TABLE usuarios ADD COLUMN cambio_token VARCHAR(255);
ALTER TABLE usuarios ADD COLUMN cambio_token_expiracion TIMESTAMP WITH TIME ZONE;
ALTER TABLE usuarios ADD COLUMN contrasena_pendiente VARCHAR(255);

CREATE INDEX idx_usuarios_reset_token ON usuarios(reset_token);
CREATE INDEX idx_usuarios_cambio_token ON usuarios(cambio_token);
