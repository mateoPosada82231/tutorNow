# Private chat between student and tutor

Objective: one chat thread per Asesoria, REST for history and sending, SSE for push, unread tracking.
Branch: `feature/chat-privado`. Delivery: `ask-on-risk`. Test runner: `mvn test` (backend), `npm test` (frontend).

## Specs

- **S1** — The chat exists only when the Asesoria already exists. No free user-to-tutor messaging and no "contact tutor" entry point. Source: user, verbatim: "solo cuando ya existe la asesoría".
- **S2** — `chatId == asesoriaId`. There is no `conversaciones` table; `mensajes.asesoria_id` is the conversation key.
- **S3** — Estado gating: `PENDIENTE` accepts new messages; `FINALIZADA` and `EVALUADA` are read-only (409 on send); `CANCELADA` rejects sends with 409 but keeps its history readable, so a cancelled thread still appears in the list flagged as cancelled.
- **S4** — Only the two parties of the Asesoria can read or write its chat: `asesoria.estudiante_id == usuarioId` or `asesoria.tutor.usuario_id == usuarioId`. Any other authenticated user gets 403.
- **S5** — Endpoints, matching the reserved contract in `.opencode/skills/api-design/SKILL.md`:
  - `GET /api/v1/chats` — my threads
  - `GET /api/v1/chats/{id}/messages?before=&size=` — history, keyset
  - `POST /api/v1/chats/{id}/messages` — 201
  - `PATCH /api/v1/chats/{id}/read` — 204
  - `GET /api/v1/chats/stream` — SSE
- **S6** — Sending is idempotent per `clientMessageId`: replaying the same pair `(asesoriaId, clientMessageId)` returns the stored message instead of creating a duplicate.
- **S7** — History is paginated by `id` (keyset), newest first in the query, oldest first in the response. `size` default 30, clamped to 1..50.
- **S8** — New messages are pushed over SSE to both participants after the transaction commits.
- **S9** — Unread count per thread = messages with `id > ultimo_leido_id` and `emisor_id != usuarioId`. Marking read never moves the cursor backwards.
- **S10** — Message content is trimmed first, then must be non-blank, then limited to 2000 characters (so padding does not consume the limit). Rendered as plain text on the client.
- **S11** — `contenido` is the only free-text field; there are no attachments in this iteration (assumption).
- **S12** — Every simulated email (verification link, password reset, password change confirmation, new-message notification) is captured in an in-memory `SimulatedEmailStore` (bounded to the latest 50, newest first) in addition to the existing console log. No signature changes, no new persistence, no schema. Source: user decision "Bandeja simulada en la app" for the notification email, extended to all simulated emails for one uniform inbox.
- **S13** — `GET /api/v1/dev/inbox` (authenticated) lists the stored simulated emails (`to`, `subject`, `content`, `link`, `kind`, `createdAt`). Default authenticated route scope; no `SecurityConfig` change. A page `/dev/inbox` ("Bandeja simulada") in the dashboard group lists them with loading/empty/error states and a per-email CTA. Source: user choice.
- **S14** — The landing `/dashboard` makes unread chat messages visible: unread counts are synced from `GET /chats` on load (navbar badge everywhere), and when there is at least one unread message the landing shows a prominent highlighted banner with a link to `/tutoring/chats`. Source: user, verbatim: "que en la landing sea mas vistoso el hecho de que hay un mensaje en la bandeja de entrada".

## Tasks

| ID | Specs | Route | Status | Evidence |
|----|-------|-------|--------|----------|
| T1 | S2, S6, S7, S9 | inline | done | `V10__create_chat_tables.sql`, `chat/model`, `chat/repository` |
| T2 | S1, S3, S4, S10 | inline | done | `tutorial/port/AsesoriaChatPort`, `chat/service/ChatService` |
| T3 | S5, S7 | inline | done | `chat/controller/ChatController`, `chat/dto` |
| T4 | S8 | inline | done | `chat/stream/ChatStreamService`, `chat/event` |
| T5 | S5 | inline | done | frontend thread list at `/tutoring/chats` |
| T6 | S5, S7, S10 | inline | done | frontend thread page + composer at `/tutoring/chats/[asesoriaId]` |
| T7 | S8, S9 | inline | done | SSE hook + unread badge in Navbar |
| T8 | S12 | delegated backend | done | `1a2b46f` — `dev/SimulatedEmailStore`, `dev/SimulatedEmail`, capture wired in `EmailService` |
| T9 | S13 (API side) | delegated backend | done | `1a2b46f` — `dev/DevInboxController` (GET /api/v1/dev/inbox) |
| T10 | S14 | delegated frontend | done | `e3930eb` — `useChatUnreadSync` hook + Navbar wiring + landing banner |
| T11 | S13 (page side) | delegated frontend | done | `e3930eb` — `/dev/inbox` page + user-menu link |

## Log

### L1 — user, verbatim
> el siguiente paso del proyecto es implementar el chat privado entre usuario y tutor, dime que me recomiendas para hacer esto

### L2 — user, verbatim
> solo cuando ya existe la asesoría

### L3 — user, verbatim
> si

### L4 — decisions taken from L1-L3 and the existing contract
- Transport: REST for send/history, SSE for push. Reason: the backend is Spring MVC servlet with stateless JWT (`SecurityConfig` has no session), so STOMP would require a broker and a CONNECT-token handshake that the stack does not have. Sends already fit `httpClient`; only the inbound notification needs push.
- `chatId == asesoriaId`, no `conversaciones` table. Reason: authorization, lifecycle and unread all resolve from one Asesoria row.
- Module `chat` reads Asesoria through `tutorial.port.AsesoriaChatPort` instead of touching `tutorial.repository` or `tutorial.model` directly.
- SSE authentication uses the standard `Authorization` header through `fetch` streaming. Native `EventSource` cannot set headers, so it is not used.
- Unread counting is a single grouped JPQL query per page of threads, not one query per thread.

### L5 — verification
- RED observed: `mvn -Dtest=ChatServiceTest,AsesoriaChatAdapterTest test` failed with 14 failures/errors (`UnsupportedOperationException: pending`) before the service bodies existed.
- GREEN: `mvn test` — 119 tests, 0 failures, 0 errors, BUILD SUCCESS. `TutorNowApplicationTests` (context load, H2) validates every entity mapping and JPQL query at bootstrap, including the grouped unread count.
- Deliberate exception: no `@DataJpaTest` for the grouped unread query. The behavior is covered with mocked repositories and the JPQL is validated at context bootstrap; a full persistence test would need the whole Asesoria graph for little extra signal.

### L6 — open decisions
- Whether the thread list should also surface `EVALUADA` threads or hide them. Assumption for now: show every Asesoria the user participates in, ordered by last activity.

### L7 — user, verbatim (2026-11-02)
> hay varios errores con el frontend del chat, como puede ver en las imagenes, adicional al error del icono, tambien  hay un eror con las margenes, me explico, sabiendo que el estilo deseado por el front es un estilo whatsapp,  este debe ocupar exactamente todo el resto de pantalla por debajo del navbar, y tanto la parte de arriba donde sale el nombre del chat como en la parte de abajo donde esta el input nunca deberian moverse, lounico que debreria movrese con el scroll es el hilo de la conversacion, ademas que en la vista de lista de mobile los padding y los margins estan mal hechos ya que no hay espacios donde debria de haberlos o viceversa, recuerda la convencion del proyecto de usar en la medida de lo posible medidas rem y no absolutas como px

Fixed and verified (62/62 frontend tests green), committed as `422cfb4 fix(chat): whatsapp-style full-screen chat layout`. Chat routes now render in a fixed-height app-shell main (100dvh minus navbar) via a conditional branch in `(dashboard)/layout.tsx`; other pages keep the padded container.

### L8 — user, verbatim (2026-11-02)
> excelente, ahora solo queda implementar la simulación de correo para la notificacion y que en la landing sea mas vistoso el hecho de que hay un mensaje en la bandeja de entrada

Decision asked and answered: "Bandeja simulada en la app" — simulated emails captured in memory and browsable at `GET /api/v1/dev/inbox` + page `/dev/inbox`; landing highlights unread messages (S12-S14, T8-T11). Current state when starting: the new-message notification email already exists as a backend console log (`EmailService.sendNewMessageNotification`), and the navbar unread badge only populates after visiting `/tutoring/chats`.

### L9 — verification of T8-T11 (2026-11-02)
- Delegated two parallel-bounded writers (backend `backend/src`, frontend `frontend/src`), disjoint surfaces.
- Backend RED observed (unresolved `SimulatedEmailStore` symbols), GREEN: 11/11 new tests; full suite `mvn test` 137/137 confirmed by parent re-run.
- Frontend RED observed (unresolved `useChatUnreadSync` import), GREEN: dashboard 5/5, inbox 5/5. Navbar.test.tsx regressed (real network when a live backend listens on :8080 — the hook's fetchChats leaked into tests); parent applied the one-mock fix (`vi.mock('@/features/chat/api/chatApi')`) in `Navbar.test.tsx` outside the writer's surface. Full suite 156/156.
- Email `kind` values shared across both sides: `verification` | `password_reset` | `password_change_confirmation` | `new_message`.
- Native review assess (`422cfb4..41d8dc4`): tier `medium` (`executable_change`: DevInboxController), `review_due: false` (`under_budget`); no native review ceremony. Stray untracked `frontend/pnpm-lock.yaml` excluded from assessment inventory, pending user disposition.

### L10 — menu restructure, user verbatim (2026-11-02)
> quedo bien, solo hay que corregir unas cosas: quitale el "simulada" del nombre; quita el numero de mensajes entrantes al lado del boton para entrar al chat; en el hamburguesa pon: publicar asesorias, mis asesorias, explorar asesorias y chats ... panel no ya que con el titulo tambien se llega alla; en el menu desplegable del perfil quedara: mi perfil, panel del tutor, bandeja de entrada y cambiar contraseña

Clarification answered: "Solo el badge del navbar" — the banner keeps its unread count, only the navbar badge is removed. Delivered in `8d68970`: hamburger/desktop main menu = Publicar asesoría, Mis asesorías, Explorar asesorías (tutor), Chats (no Panel, no Panel del tutor); user menu = Mi perfil, Panel del tutor (tutor), Bandeja de entrada, Cambiar contraseña (+ Cerrar sesión kept); "Bandeja simulada" renamed "Bandeja de entrada" everywhere; banner adds the simulated-email note and a secondary inbox link. RED observed (6 failing) before implementation; full suite 158/158.

### L10 — UX polish v2 (2026-10-29)
- **Optimistic UI**: mensaje propio aparece INMEDIATAMENTE al hacer send (sombra + opacidad 70%), se reemplaza por el real cuando llega vía SSE (match por `clientMessageId`)
- **Separadores de fecha** tipo WhatsApp: agrupa mensajes por día (Hoy / Ayer / Lunes 28 octubre)
- **Navbar redesign** por rol:
  - Tutor: Panel · Publicar asesoría · Mis asesorías · Explorar asesorías · Chats · Panel de tutor
  - Estudiante: Panel · Publicar asesoría · Mis asesorías · Chats
- **Página /tutoring/explore** (solo tutors): filtros por texto, materia, modalidad; reutiliza `RequestCard`
- **Badge no leídos** ya funcionaba en navbar y dropdown
- `Mensaje` type incluye `clientMessageId?: string` para matching optimista↔real
- Tests: 147 frontend + 126 backend = 273 passing
- Build: OK
