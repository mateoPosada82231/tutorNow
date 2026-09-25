CREATE TABLE carreras (
    id              BIGSERIAL PRIMARY KEY,
    nombre          VARCHAR(150) NOT NULL UNIQUE,
    activa          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE semestres (
    id              BIGSERIAL PRIMARY KEY,
    numero          INTEGER NOT NULL UNIQUE,
    activo          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE usuarios ADD COLUMN carrera_id BIGINT REFERENCES carreras(id);
ALTER TABLE usuarios ADD COLUMN semestre_id BIGINT REFERENCES semestres(id);

INSERT INTO carreras (nombre) VALUES
('Ingenieria de Sistemas'),
('Ingenieria Civil'),
('Ingenieria Electronica'),
('Ingenieria Mecanica'),
('Ingenieria Industrial'),
('Ingenieria Ambiental'),
('Ingenieria de Minas'),
('Ingenieria Biomedica'),
('Ingenieria de Alimentos'),
('Ingenieria Quimica'),
('Arquitectura'),
('Matematicas'),
('Fisica'),
('Quimica'),
('Ciencias Biologicas'),
('Licenciatura en Quimica'),
('Tecnologia en Analisis y Desarrollo de Software'),
('Tecnologia en Redes y Telecomunicaciones'),
('Tecnologia en Gestion de Recursos Naturales');

INSERT INTO semestres (numero) VALUES
(1),(2),(3),(4),(5),(6),(7),(8),(9),(10),(11),(12);
