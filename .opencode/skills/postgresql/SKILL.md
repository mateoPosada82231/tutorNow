---
name: postgresql
description: Use when designing or reviewing PostgreSQL schemas, migrations, queries, or database-related code for tutorNow. Covers naming, indexing, enums, and PII encryption.
---

# PostgreSQL Conventions - tutorNow

## Stack
- PostgreSQL 15+
- Spring Data JPA (Hibernate)
- Flyway o Liquibase para migraciones

## Naming Conventions
- **Tablas**: snake_case plural (`usuarios`, `solicitudes_asesoria`)
- **Columnas**: snake_case (`correo_electronico`, `fecha_creacion`)
- **Foreign Keys**: `prefijo_id` (`usuario_id`, `solicitud_id`)
- **Índices**: `idx_tabla_columna` (`idx_usuarios_correo`)
- **Unique constraints**: `uniq_tabla_columna` (`uniq_usuarios_correo`)
- **Primary Keys**: `id` (BIGSERIAL autoincrement)

## Tipos de datos
```sql
-- IDs
id BIGSERIAL PRIMARY KEY

-- Texto
nombre VARCHAR(100) NOT NULL
descripcion TEXT

-- Fechas
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()

-- Dinero (si aplica)
tarifa DECIMAL(10, 2)

-- Booleanos
activo BOOLEAN DEFAULT TRUE

-- Enums (ver abajo)
estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
```

## Enums - Via CHECK constraints o custom types
```sql
-- Opción 1: CHECK constraint (recomendado para flexibilidad)
ALTER TABLE solicitudes_asesoria
ADD CONSTRAINT chk_estado_solicitud
CHECK (estado IN ('PUBLICADA', 'CON_PROPUESTAS', 'EN_COORDINACION', 'FINALIZADA', 'EVALUADA', 'CANCELADA'));

-- Opción 2: Custom type (más estricto)
CREATE TYPE estado_solicitud AS ENUM ('PUBLICADA', 'CON_PROPUESTAS', 'EN_COORDINACION', 'FINALIZADA', 'EVALUADA', 'CANCELADA');
```

## Migraciones (Flyway)
- Ubicación: `src/main/resources/db/migration/`
- Naming: `V1__create_usuarios_table.sql`, `V2__add_email_index.sql`
- Nunca editar migraciones ya ejecutadas
- Cada migración atómica e idempotente cuando sea posible

## Tablas principales (schema inicial)

### usuarios (IMPLEMENTADO - V1 + V2)
```sql
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
    reset_token VARCHAR(255),
    reset_token_expiracion TIMESTAMP WITH TIME ZONE,
    cambio_token VARCHAR(255),
    cambio_token_expiracion TIMESTAMP WITH TIME ZONE,
    contrasena_pendiente VARCHAR(255),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uniq_usuarios_correo UNIQUE (correo_electronico)
);

CREATE INDEX idx_usuarios_correo ON usuarios(correo_electronico);
CREATE INDEX idx_usuarios_verification_token ON usuarios(verification_token);
CREATE INDEX idx_usuarios_reset_token ON usuarios(reset_token);
CREATE INDEX idx_usuarios_cambio_token ON usuarios(cambio_token);
```

Decisiones (2026-09-13):
- Enum `rol` vía columna VARCHAR: `ESTUDIANTE` (default en registro), `TUTOR`, `ADMIN`
- Tokens de verificación/reset/cambio viven EN LA TABLA usuarios (no tabla separada): UUID single-use, se limpian a NULL al usarse; solicitar uno nuevo sobrescribe el anterior
- Índices en todos los tokens porque se consultan por lookup directo
- Expiraciones: verification 24h, reset y cambio 15 min (validadas en la capa de servicio, no en BD)

### solicitudes_asesoria
```sql
CREATE TABLE solicitudes_asesoria (
    id BIGSERIAL PRIMARY KEY,
    solicitante_id BIGINT NOT NULL REFERENCES usuarios(id),
    asignatura VARCHAR(100) NOT NULL,
    tema VARCHAR(200) NOT NULL,
    descripcion TEXT,
    modalidad VARCHAR(20) NOT NULL,
    disponibilidad VARCHAR(200),
    presupuesto DECIMAL(10, 2),
    estado VARCHAR(20) NOT NULL DEFAULT 'PUBLICADA',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### propuestas
```sql
CREATE TABLE propuestas (
    id BIGSERIAL PRIMARY KEY,
    solicitud_id BIGINT NOT NULL REFERENCES solicitudes_asesoria(id),
    tutor_id BIGINT NOT NULL REFERENCES usuarios(id),
    tarifa_hora DECIMAL(10, 2) NOT NULL,
    horario VARCHAR(200) NOT NULL,
    modalidad VARCHAR(20) NOT NULL,
    mensaje TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### resenas
```sql
CREATE TABLE resenas (
    id BIGSERIAL PRIMARY KEY,
    asesoria_id BIGINT NOT NULL REFERENCES asesorias(id),
    autor_id BIGINT NOT NULL REFERENCES usuarios(id),
    destinatario_id BIGINT NOT NULL REFERENCES usuarios(id),
    calificacion INTEGER NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
    comentario TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uniq_resena_por_asesoria UNIQUE (asesoria_id, autor_id)
);
```

## Índices
```sql
-- Queries frecuentes
CREATE INDEX idx_solicitudes_estado ON solicitudes_asesoria(estado);
CREATE INDEX idx_solicitudes_asignatura ON solicitudes_asesoria(asignatura);
CREATE INDEX idx_propuestas_solicitud ON propuestas(solicitud_id);
CREATE INDEX idx_propuestas_tutor ON propuestas(tutor_id);
CREATE INDEX idx_resenas_destinatario ON resenas(destinatario_id);
```

## Cifrado at-rest PII
Para datos sensibles (identification, full_name, mobile_number):
- Cifrar antes de insertar en la BD
- Usar AES-256-GCM desde Java (Spring Boot)
- Almacenar como BYTEA o TEXT (base64 del ciphertext)

## Reglas
- Sin comentarios en el schema SQL
- Siempre usar `created_at` y `updated_at` con default
- Foreign keys explícitas
- CHECK constraints para validaciones de dominio
- No usar CASCADE en DELETE (preferir soft delete con `activo`)
