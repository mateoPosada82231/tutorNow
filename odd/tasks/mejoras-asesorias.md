# Feature: mejoras-asesorias

Objetivo: 4 arreglos/UX pequeños — selector de semanas en la agenda (tutor y estudiante), selección opcional de tutores que ven una publicación, modal de confirmación de materias al crear perfil de tutor, y modal de confirmación de detalles antes de publicar una asesoría.
Rama: `feature/mejoras-asesorias` (desde `main`). Estrategia de entrega: commits por unidad de trabajo en la rama; push/PR son decisión del usuario.
Test runner: frontend `npm test` (vitest run, cwd `frontend/`); backend `mvn test` (cwd `backend/`).

## Specs

### S1 — Selector de semanas en la grilla de disponibilidad
Cita del usuario (L3): "la idea seria que muestre los slots iguales (lunes-domingo) y que en la parte de arriba salga una selector de semana en elq ue pueda cambiar de semana 2 veces y devolverse, algo como: `< 9 nov - 15 nov >` `< 16 nov - 22 nov >` `< 23 nov - 29 nov >` y que sea navegable entre ellas, serian siempre 3 semanas (la actual y otras 2) y el estudiante viendo el perfil del tutor tambien podra navegar entre ellas, obviamente todo bien estilado"

- S1.1: En la agenda del tutor (`agenda/page.tsx` con `AvailabilityGrid`) aparece, arriba de la grilla, un selector de semana navegable con formato `‹ 9 nov - 15 nov ›` (botón anterior, rango, botón siguiente).
- S1.2: Siempre hay exactamente 3 semanas navegables: la semana actual, la siguiente y la posterior (+1, +2). No se puede navegar antes de la semana actual ni más allá de +2.
- S1.3: El estudiante en el perfil del tutor (`tutoring/tutors/[tutorId]/page.tsx`) ve el mismo selector y también puede navegar entre esas 3 semanas.
- S1.4: Cada una de las 3 semanas muestra su propio conjunto de bloques (ya NO son recurrentes; ver S5): navegar de semana cambia el contenido de la grilla según lo guardado para esa semana.
- S1.5: El selector está bien estilado y consistente con el diseño existente (colores/tokens del proyecto, botones con labels accesibles).
- S1.6: `HOUR_SLOTS` sigue exponiendo 8→17 vía export existente; este feature no cambia horas de slots (otro arreglo del usuario lo pedirá aparte si hace falta).

### S2 — Selección opcional de tutores que ven la publicación
Cita del usuario (L2): "añadir el feature que el estudiante al momento de crear una publicacion se le habilite la opcion de seleccionar manuealmnete los tutores que puedan ver su asesoria (estos es opcional)"

- S2.1: En `PublishRequestForm`, el estudiante puede (opcional) seleccionar manualmente uno o más tutores que verán su publicación.
- S2.2: La selección es opcional: sin selección, el comportamiento es idéntico al actual (ven la publicación los tutores según los filtros existentes).
- S2.3: El backend guarda la audiencia de la solicitud; cuando hay audiencia, el feed del tutor solo incluye la solicitud si el tutor está en la audiencia (restricción adicional a los filtros existentes de materia, nunca los reemplaza).
- S2.4: Hay un endpoint para listar tutores (id, nombre, materias) que el formulario usa para el selector.
- S2.5: El selector de tutores incluye búsqueda por nombre (insensible a mayúsculas/minúsculas) y enlace a "Ver perfil" que abre la ficha pública del tutor en una pestaña nueva.
- S2.6: Tests: RED→GREEN en frontend (selector opcional, submit con/sin audiencia) y backend (persistencia de audiencia + filtrado del feed).
- S2.7: El detalle (`GET /tutoring-requests/{id}`) y las propuestas devuelven 403 para un tutor que no está en la audiencia de una solicitud restringida.

### S3 — Modal de confirmación de materias al crear perfil de tutor
Cita del usuario (L4): "al momneto de que el tutor cree su perfil de tutor y escoja por primera vez las materias se debera mostrar un modal de confirmacion de su seleccion de matreias (todo esto pensando en el user feedback)"

- S3.1: Al confirmar el guardado en `BecomeTutorModal` (primera creación del perfil de tutor), si hay materias seleccionadas, se muestra un modal de confirmación listando esas materias.
- S3.2: El guardado (`POST /tutors/me`) solo ocurre tras confirmar en el modal; cancelar vuelve al formulario sin guardar.
- S3.3: La edición posterior desde `TutorProfileForm` (PUT /tutors/me) NO muestra este modal (es solo "por primera vez", al crear el perfil).
- S3.4: Tests RED→GREEN en `BecomeTutorModal.test.tsx`.

### S4 — Modal de confirmación de detalles antes de publicar
Cita del usuario (L5): "tambien un modal para confirmar los detalles de la asesoria antes de publicarla"

- S4.1: Al enviar `PublishRequestForm` con datos válidos, primero se abre un modal que resume los detalles de la asesoría (materia, tema, modalidad, disponibilidad, descripción).
- S4.2: `createTutoringRequest` solo se ejecuta tras confirmar; cancelar cierra el modal y permite seguir editando.
- S4.3: Tests RED→GREEN en `PublishRequestForm.test.tsx`.

### S5 — Horarios distintos por semana (modelo de datos de slots)
Cita del usuario (L11): "hay un problema con la agenda del tutor, como se guarda en una semana se reproduce en la otra, y la idea es qu elos horarios sean distintos"
Decisión del usuario (L11): cada semana sin horarios guardados arranca vacía — "arrancar vacia"; aplica también a las semanas +1 y +2 de tutores que ya tienen agenda cargada.

- S5.1: `tutor_slots` identifica la semana: nueva columna `semana_inicio DATE NOT NULL` (lunes de la semana del slot) agregada por la migración V14; la restricción única pasa a `(tutor_id, semana_inicio, dia_semana, hora_inicio)`.
- S5.2: La migración asigna los slots existentes a la semana actual (lunes de hoy); las semanas +1 y +2 de esos tutores arrancan vacías.
- S5.3: `PUT /tutors/me/slots` recibe `semanaInicio` (fecha ISO `yyyy-MM-dd`, se normaliza al lunes de esa semana; si falta, la semana actual del servidor) y reemplaza SOLO los slots de esa semana sin tocar las demás semanas del tutor.
- S5.4: `GET /tutors/me/slots` y el perfil público del tutor (`disponibilidad`) devuelven cada slot con su `semanaInicio`.
- S5.5: La agenda del tutor edita y guarda la semana visible; navegar entre semanas muestra los bloques guardados de esa semana (vacío si no hay) y los cambios sin guardar de una semana no se mezclan con otra.
- S5.6: El perfil del tutor visto por el estudiante muestra los bloques de la semana visible, independientes por semana; si esa semana está vacía pero el tutor tiene bloques en otras, se muestra la grilla vacía con un aviso.
- S5.7: Tests RED→GREEN: backend (guardado por semana aísla semanas distintas, normalización a lunes, default semana actual, respuesta con `semanaInicio`, perfil con `semanaInicio`) y frontend (contenido distinto por semana, save con `semanaInicio` de la semana activa, semanas vacías independientes, vista del estudiante por semana).

## Tasks

| ID | S# | Ruta | Estado | Commit |
|----|----|------|--------|--------|
| T1 | S1 | inline | completado | 6382e4a |
| T2 | S2 | inline | completado | ac45bf0 |
| T3 | S3 | inline | completado | 7571580 |
| T4 | S4 | inline | completado | 42df79e |
| T2-fix | S2.6 | inline | completado | 8105c8a |
| T6 | S2.5 | inline | completado | — |
| T5 | S5 | inline | en curso | 23ce0a9 |

Ruta declarada: inline en todas las tareas — ninguna escritor trigger (ninguna unidad supera ~100 líneas con superficies disjoint que justifiquen writer paralelo; T2 y T4 comparten `PublishRequestForm.tsx`, así que van secuenciales de todos modos).

## Log

L1 (solicitud original del usuario): "hay que hacerle varios arreglos pequeños a la app:
-para proteger la anonimidad de los comentarios en las asesorias solo se vera el comentario que puse yo (puede ser el tutor o el estudiante) pero el de la otra persona no
-añadir el feature que el estudiante al momento de crear una publicacion se le habilite la opcion de seleccionar manuealmnete los tutores que puedan ver su asesoria (estos es opcional)
-hay que ampliar los slots de agenda de los tutores, de 6 de la mañana a 10 de la noche, ademas de que este podra tener agendas tambien de las proximas 2 semanas
-al momneto de que el tutor cree su perfil de tutor y escoja por primera vez las materias se debera mostrar un modal de confirmacion de su seleccion de matreias (todo esto pensando en el user feedback)
-tambien un modal para confirmar los detalles de la asesoria antes de publicarla

crea una rama para todos estos features"

L2 (2026-11-12): el usuario confirma que el primer fix (anonimidad de comentarios en asesorías) YA está implementado por el equipo: "el primer fix que te dije ya esta implementado, el de quitar el comentario de la otra persona para la anonimidad, ese ya esta, quitalo del todo". Fuera de alcance; no se toca nada de `Resena`/`resenaContraparte`.

L3 (2026-11-12): aclaración de diseño sobre la agenda (respuesta al focused question sobre el modelo de slots): el modelo sigue siendo recurrente lunes–domingo; se agrega un selector de semana arriba, siempre 3 semanas (actual, +1, +2), navegable de ida y vuelta, en la agenda del tutor Y en el perfil del tutor visto por el estudiante, "obviamente todo bien estilado". Ejemplos de rangos dados por el usuario: "9 nov - 15 nov", "16 nov - 22 nov", "23 nov - 29 nov".

L4 (2026-11-12): T1 completado — commit 6382e4a. Tests AvailabilityGrid 12/12 (4 nuevos RED→GREEN); agenda page 10/10 y tutor page 7/7 sin regresiones. Risk: none (cambios aditivos; el comportamiento por defecto de la grilla no cambia).

L5 (2026-11-12): T2 completado — commit ac45bf0. RED backend por compilación (símbolos nuevos), luego GREEN: SolicitudServiceTest y SolicitudAudienciaIntegrationTest (H2+Flyway, feed con/sin audiencia, detalle 403, GET /tutors). Excepción de política: los tests frontend de S2 se escribieron después del implement (no se observó RED en frontend); el backend sí tuvo RED→GREEN. Suites completas: backend mvn test EXIT=0, frontend 185/185. `npm run lint` no corre: Next.js propone crear config ESLint de forma interactiva (repo sin .eslintrc) — no se tocó por estar fuera de alcance. Risk: item 2 (controla qué tutores pueden ver una publicación; un error expondría la solicitud a tutores no seleccionados) → dispara verificador independiente.

L6 (2026-11-12): T3 completado — commit 7571580. RED 4/7 fallaban → GREEN 7/7. Risk: none.

L7 (2026-11-12): T4 completado — commit 42df79e. RED 6/11 fallaban → GREEN 11/11; suite frontend completa 190/190. Risk: none.

L8 (2026-11-12): `gentle-ai` no está en el PATH de esta máquina (where.exe sin resultado) → el assess nativo RDD no está disponible en esta sesión; no se inventó ningún resultado de review. La verificación del item 2 de alto riesgo (T2) se delega a un verificador independiente.

L9 (2026-11-12): verificador independiente (`gentle-ai-verify`) completó probes en scratch (workspace intacto, HEAD 42df79e). S2.1–S2.5 pass; **1 blocker en S2.6**: `POST /tutoring-requests/{id}/proposals` devolvía 201 y mutaba `PUBLICADA→EN_PROCESO` para un tutor fuera de la audiencia, porque `PropuestaService.create` nunca consultaba `SolicitudAudienciaTutorRepository`.

L10 (2026-11-12): corrección acotada del blocker (un batch + recheck limitado): RED en `PropuestaServiceTest` (3 tests nuevos S2.6: fuera de audiencia → ForbiddenException "No tienes acceso a esta asesoria" sin mutar la solicitud; dentro → propuesta creada; sin audiencia → comportamiento baseline) → gate en `PropuestaService.create` tras resolver tutor/solicitud → GREEN. Los 3 probes del verificador se copiaron como regression tests (`T2VerifierProbeTest`, `T2VerifierDetailParityTest`, `T2VerifierProbe.test.tsx`); el probe frontend se adaptó al modal de confirmación de T4 (flujo ahora pide "Confirmar y publicar"). Recheck: suite acotada EXIT=0, backend completo EXIT=0, frontend 196/196. Commit corrección: 8105c8a. Risk: item 2 (gate de autorización de propuestas).

L11 (2026-11-12): el usuario reporta el 5º cambio: "hay un problema con la agenda del tutor, como se guarda en una semana se reproduce en la otra, y la idea es qu elos horarios sean distintos". Focused question sobre semanas sin horarios: el usuario responde "arrancar vacia" — cada semana sin horarios guardados arranca vacía (no copia la semana anterior), y esto aplica también a las semanas +1 y +2 de tutores que ya tienen agenda cargada. Reescribe S1.4 (ya no recurrente); nuevo spec S5 con migración V14 (`semana_inicio`), tarea T5 en curso. Fuera de alcance: no se toca nada de `Resena`/`resenaContraparte` (L2).

L12 (2026-11-12): mejora a S2 — el usuario pide que al seleccionar tutores en la publicación se pueda: 1) ver el perfil del tutor, 2) buscar por nombre (insensible a mayúsculas/minúsculas). Se añade `busquedaTutores` + filtro en `PublishRequestForm`, y enlace "Ver perfil" a `/tutoring/tutors/{id}` en nueva pestaña. Actualiza S2.5 (nuevo S2.5) y añade T6 completado. Frontend 203/203 y backend 212/212 verdes.
