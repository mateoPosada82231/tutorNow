# tutorNow

Plataforma web colaborativa de asesorías académicas entre pares del Politécnico Colombiano Jaime Isaza Cadavid.

## Descripción

tutorNow conecta estudiantes que necesitan apoyo académico con tutores pares que pueden ayudarlos. Los estudiantes publican solicitudes estructuradas y los tutores se postulan con propuestas comparables. El estudiante selecciona manualmente la mejor propuesta y coordinan la asesoría vía chat interno.

## Tech Stack

| Componente | Tecnología |
|------------|------------|
| Backend | Spring Boot 3 + Spring Modulith |
| Base de datos | PostgreSQL 15+ |
| Frontend | Next.js 14+ (App Router) |
| Estilos | Tailwind CSS (mobile-first, rem) |
| State | Zustand |
| Seguridad | Spring Security, BCrypt, JWT, OAuth2 |

## Estructura del repositorio

```
tutorNow/
├── .opencode/              # Configuración de opencode (agents, skills)
├── backend/                # Spring Boot (co.edu.epi.tutornow)
│   ├── src/main/java/
│   └── src/test/java/
├── frontend/               # Next.js
│   ├── src/app/
│   ├── src/features/
│   └── src/components/
└── README.md
```

## Backend (Spring Boot)

### Módulos (Spring Modulith)
- **auth**: Autenticación, JWT, OAuth2
- **users**: Gestión de usuarios y perfiles
- **tutorial**: Solicitudes, propuestas, agenda, estados, chat
- **reviews**: Reputación y reseñas
- **admin**: Administración y moderación

### Correr el backend
```bash
cd backend
./mvnw spring-boot:run
```

### Base de datos
```bash
# Requiere PostgreSQL 15+ corriendo
# Configurar en application-dev.yml
```

## Frontend (Next.js)

### Estructura (Feature-based)
- `src/app/` - Rutas (App Router)
- `src/features/` - Features por dominio (auth, tutoring, profile, reviews, admin)
- `src/components/` - Componentes compartidos (ui/, layout/)
- `src/lib/` - Utilidades (httpClient, config, utils)
- `src/stores/` - Zustand stores

### Correr el frontend
```bash
cd frontend
npm install
npm run dev
```

## Convenciones de desarrollo

Todas las convenciones están documentadas en `.opencode/skills/`:

| Skill | Archivo |
|-------|---------|
| Spring Boot | `.opencode/skills/spring-boot/SKILL.md` |
| Next.js | `.opencode/skills/nextjs/SKILL.md` |
| Tailwind CSS | `.opencode/skills/tailwind-mobile/SKILL.md` |
| PostgreSQL | `.opencode/skills/postgresql/SKILL.md` |
| API Design | `.opencode/skills/api-design/SKILL.md` |
| Git | `.opencode/skills/git-conventions/SKILL.md` |
| Testing | `.opencode/skills/testing/SKILL.md` |

## Agentes de IA

| Agente | Descripción |
|--------|-------------|
| `backend-dev` | Spring Boot, JPA, PostgreSQL, REST, seguridad |
| `frontend-dev` | Next.js, Tailwind CSS, mobile-first, Zustand |

## Git

### Ramas
- `feature/{descripcion}` - Nuevas funcionalidades
- `fix/{descripcion}` - Corrección de bugs
- `refactor/{descripcion}` - Refactorización
- `chore/{descripcion}` - Mantenimiento

### Commits
Conventional Commits: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`

## Dominio

Correo institucional: `@elpoli.edu.co`

## Paquete Java

`co.edu.epi.tutornow`
