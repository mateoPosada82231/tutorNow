CREATE TABLE tutores (
    id              BIGSERIAL PRIMARY KEY,
    usuario_id      BIGINT NOT NULL REFERENCES usuarios(id),
    biografia       TEXT NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uniq_tutores_usuario_id UNIQUE (usuario_id)
);

CREATE TABLE materias (
    id              BIGSERIAL PRIMARY KEY,
    nombre          VARCHAR(150) NOT NULL,
    activa          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uniq_materias_nombre UNIQUE (nombre)
);

CREATE TABLE tutor_materias (
    tutor_id        BIGINT NOT NULL REFERENCES tutores(id),
    materia_id      BIGINT NOT NULL REFERENCES materias(id),
    PRIMARY KEY (tutor_id, materia_id)
);

CREATE INDEX idx_tutor_materias_tutor_id ON tutor_materias(tutor_id);
CREATE INDEX idx_tutor_materias_materia_id ON tutor_materias(materia_id);

INSERT INTO materias (nombre) VALUES
('Calculo Diferencial'),
('Calculo Integral'),
('Calculo Vectorial'),
('Algebra Lineal'),
('Ecuaciones Diferenciales'),
('Matematicas Discretas'),
('Probabilidad y Estadistica'),
('Estadistica Inferencial'),
('Fisica I'),
('Fisica II'),
('Fisica III'),
('Quimica General'),
('Quimica Organica'),
('Programacion I'),
('Programacion II'),
('Estructuras de Datos'),
('Bases de Datos'),
('Logica de Programacion'),
('Ingles I'),
('Ingles II'),
('Ingles III'),
('Algoritmos y Complejidad'),
('Sistemas Operativos'),
('Redes de Computadores'),
('Ingenieria de Software'),
('Arquitectura de Computadores'),
('Inteligencia Artificial'),
('Analisis Numerico'),
('Metodos Numericos'),
('Microeconomia'),
('Macroeconomia'),
('Contabilidad General'),
('Contabilidad de Costos'),
('Administracion General'),
('Finanzas Corporativas'),
('Mercadeo'),
('Dibujo Tecnico'),
('Estatica'),
('Termodinamica'),
('Resistencia de Materiales');
