CREATE TABLE mensajes (
    id BIGSERIAL PRIMARY KEY,
    asesoria_id BIGINT NOT NULL REFERENCES asesorias(id),
    emisor_id BIGINT NOT NULL REFERENCES usuarios(id),
    contenido VARCHAR(2000) NOT NULL,
    client_message_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uniq_mensaje_cliente UNIQUE (asesoria_id, client_message_id)
);

CREATE INDEX idx_mensajes_asesoria ON mensajes(asesoria_id, id DESC);

CREATE TABLE chat_lecturas (
    asesoria_id BIGINT NOT NULL REFERENCES asesorias(id),
    usuario_id BIGINT NOT NULL REFERENCES usuarios(id),
    ultimo_leido_id BIGINT,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (asesoria_id, usuario_id)
);
