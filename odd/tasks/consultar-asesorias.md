# Consultar asesorias (mis asesorias + explorar)

Objective: users consult the asesorias they take part in with their state; tutors get a tutor/student division inside "Mis asesorias" with filters; explore inputs use the shared UI components.
Branch: `feature/consultar-asesorias`. Delivery: `single-pr` (repo convention: one feature branch -> one PR). Test runner: `mvn test` (backend), `npm test` (frontend).
Forecast: ~700 authored changed lines (backend ~90, frontend ~320, tests ~300) -> over the ~400 advisory; will ask once for the PR slicing strategy before the first work-unit commit.

## Specs

- **S1** — Verbatim user: "El sistema deberá permitir a los usuarios consultar las asesorías en las que participan y su estado correspondiente". Every listed row shows its own estado (chip).
- **S2** — Verbatim user: "como tutor va a tener la division interna de tutor y estudiante (para que pueda ver las que el tiene en curso como tutor y las que ha publicado como estudiante)". In `/tutoring/requests` a user with role `TUTOR` sees two internal divisions: "Como tutor" (default) and "Como estudiante".
- **S3** — Verbatim user: "que en cada una se vea con su respectivo estado". The "Como tutor" division lists the asesorias where the viewer is the assigned tutor (any estado) with the estado chip and the counterpart (estudiante) name.
- **S4** — Verbatim user: "también que se pueda aplicar filtro para buscar mas facil". "Como tutor" filters by estado de la asesoria and by materia. "Como estudiante" keeps the phase tabs (por aceptar / en coordinacion / historial) as its state filter plus a materia filter.
- **S5** — Verbatim user: "los inputos de explorar asesorias tiene los inputos mal, no esta usando los componentes predefinidos y sus input tiene estilos distintos al resto de la app". `/tutoring/explore` uses the shared `Input` and `Select` components instead of raw `<input>`/`<select>`.
- **S6** — A user with role `ESTUDIANTE` keeps the current "Mis asesorias" behavior unchanged (three phase tabs, no tutor/student division). (assumption: the requirement only asks for the division on tutors)
- **S7** — (assumption, extension) The explore search field, whose placeholder promises "Buscar por tema, materia...", actually filters by text over `tema` and materia label. Added because fixing only the styles would leave the field visibly broken; the user can veto this.
- **S8** — Backend contract: `GET /api/v1/tutoring-requests?vista=abiertas` is allowed for `TUTOR` (global open-solicitud feed, used by explore); `vista=coordinacion|historial` for a `TUTOR` are scoped to the solicitudes where the tutor is the estudiante. `ADMIN` is rejected with 403. `GET /api/v1/tutoring-requests/accepted` gains optional `estado` (EstadoAsesoria) and `materiaId` filters.

## Tasks

| ID | Specs | Route | Status | Evidence |
|----|-------|-------|--------|----------|
| T1 | S2, S3, S6, S8 | inline | todo | - |
| T2 | S2, S3, S4, S6 | inline | todo | - |
| T3 | S5, S7, S8 | inline | todo | - |

## Log

### L1 — user, verbatim
> vamos a implementar el feature de conusltar asesorias:
> El sistema deberá permitir a los usuarios consultar las asesorías en las que participan y su estado correspondiente
>
> en el menu de mis aserorias:
> como tutor va a tener la divison interna de tutor y estudiante (para que pueda ver las que el tiene en curso como tutor y las que ha publicado como estudiante), y que en cada una se vea con su respectivo estado, también que se pueda aplicar filtro para bscar mas facil
>
> tambien como un pequeño fix adicional los inputos de explorar asesorias tiene los inputos mal, no esta usando los componentes predefinidos y sus input tiene estilos distintos al resto de la app

### L2 — user, verbatim
> continua

### L3 — design decisions from L1/L2 and the existing code
- Menu "Mis asesorias" already points to `/tutoring/requests`; today a tutor there sees the global open-solicitud feed (the same thing "Explorar asesorias" shows). The division replaces that feed for tutors; the open feed stays reachable through "Explorar asesorias".
- "Como tutor" reuses the existing `GET /tutoring-requests/accepted` (returns the tutor's asesorias with `asesoria.estado` and the estudiante brief) instead of adding a new endpoint; only the optional filters are added.
- "Como estudiante" reuses the existing student vistas, which the backend previously rejected for tutors (403). The guard is relaxed to `ADMIN`-only so a tutor can see the solicitudes they published as a student.
- Bug found while mapping: `/tutoring/explore` sends `vista=abiertas` while it is tutor-only, so the backend rejected it with 403 and the page failed to load. The relaxed guard fixes it.
- Bug found while mapping: the explore search input never filtered anything (`searchQuery` was only used to show the "Limpiar" button). S7 closes that gap.
