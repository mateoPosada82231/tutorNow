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

## Tasks

| ID | Specs | Route | Status | Evidence |
|----|-------|-------|--------|----------|
| T1 | S2, S6, S7, S9 | inline | done | `V10__create_chat_tables.sql`, `chat/model`, `chat/repository` |
| T2 | S1, S3, S4, S10 | inline | done | `tutorial/port/AsesoriaChatPort`, `chat/service/ChatService` |
| T3 | S5, S7 | inline | done | `chat/controller/ChatController`, `chat/dto` |
| T4 | S8 | inline | done | `chat/stream/ChatStreamService`, `chat/event` |
| T5 | S5 | inline | pending | frontend thread list |
| T6 | S5, S7, S10 | inline | pending | frontend thread page + composer |
| T7 | S8, S9 | inline | pending | SSE hook + unread badge |

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

### L7 — independent verification round 1 (2026-10-28)
Verifier ran a scratch-copy probe suite (`@SpringBootTest` + MockMvc + H2 + spying `ChatStreamService`). S1-S11 PASS, migration mapping statically PASS, `ddl-auto: validate` on PostgreSQL UNAVAILABLE (no isolated instance authorized).

- **Blocker (fixed):** `ChatStreamService.suscribir` used `computeIfAbsent(...).add(emitter)`, which is not atomic with the `computeIfPresent` cleanup. A reconnect racing a timeout/completion lost the live emitter (82 losses in 200 000 iterations). Fixed by registering inside a single `compute`. Regression test `ChatStreamServiceTest.concurrenciaNoPierdeEmisores` reproduces the loss on the old code and passes on the fix.
- **Advisory (fixed):** `@Size(max = 2000)` on the raw payload rejected a padded message whose trimmed content was exactly 2000. The limit now applies after trimming in `ChatService`.
- **Advisory (fixed):** the `spring-boot` skill claimed `chat/` does not touch `tutorial.model`, which contradicted the FK reference to `Asesoria`. Doc corrected.
- **Advisory (accepted):** two truly simultaneous identical `POST`s would surface a `DataIntegrityViolationException` as 500 instead of replaying the stored message. Data stays correct thanks to the V10 unique constraint; retry serialization is out of scope for this slice.
- **Advisory (accepted):** `ChatService.listar` issues one last-message query per thread. Bounded by the number of threads a user has.
- `mvn test` after the correction: 126 tests, 0 failures, 0 errors.
