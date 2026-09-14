---
name: spring-boot
description: Use when writing or reviewing Spring Boot backend code for tutorNow. Covers project structure, JPA entities, REST controllers, security, DTOs, and Modulith conventions.
---

# Spring Boot Conventions - tutorNow

## Stack
- Java 17+
- Spring Boot 3
- Spring Modulith (monolito modular)
- Spring Data JPA + PostgreSQL
- Spring Security (BCrypt, JWT, OAuth2)
- Lombok
- Validation (`@Valid`)

## Package base
`co.edu.epi.tutornow`

## Estructura modular (Spring Modulith)
```
co/edu/epi/tutornow/
├── auth/
│   ├── controller/
│   ├── service/
│   ├── repository/
│   ├── model/
│   ├── dto/
│   └── config/
├── users/
├── tutoring/
├── reviews/
├── admin/
└── common/
    ├── exception/
    ├── config/
    └── util/
```

## Capas
- **Controller**: `@RestController`, maneja HTTP request/response. Sin lógica de negocio.
- **Service**: `@Service`, lógica de negocio. Transacciones aquí.
- **Repository**: `@Repository`, interfaces JPA. Solo consultas, sin lógica.
- **Model**: Entidades JPA (`@Entity`). Naming en español: `Usuario`, `SolicitudAsesoria`, `Propuesta`, `Resena`.
- **DTOs**: Request/Response objects. Naming en inglés: `RegisterRequest`, `LoginRequest`, `AuthResponse`, `UserResponseDTO`. Siempre desacoplar la API de las entidades.

## Lombok
```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
```
Entidades: usar `@Getter` y `@Setter` individualmente (no `@Data` en entidades JPA).

## Naming conventions
- Tablas: snake_case plural (`usuarios`, `solicitudes_asesoria`)
- Columnas: snake_case (`correo_electronico`, `fecha_creacion`)
- Entidades: PascalCase español (`Usuario`, `SolicitudAsesoria`)
- DTOs: PascalCase inglés (`RegisterRequest`, `UserResponseDTO`)
- Endpoints: kebab-case plural (`/api/v1/tutoring-requests`)
- Variables/métodos: camelCase

## Seguridad
- **BCrypt** para contraseñas
- **JWT**: expiración configurable, claim `type` (ACCESS, RESET, BETA)
- **Reset token**: 15 min de vida
- **OAuth2**: Google + Facebook con `SecurityConfig`
- **Roles**: `USER`, `BETA_TESTER`, `ADMIN`
- **Method security**: `@PreAuthorize("hasRole('ADMIN')")`
- **Ownership**: verificar email en endpoints protegidos, retornar 403 si no coincide
- **Rate limiting**: in-memory en auth endpoints (aceptable para el proyecto)
- **Revocación tokens**: lista negra in-memory con expiración natural
- **Cifrado at-rest PII**: identification, full_name, mobile_number
- **Cifrado E2E**: AES-256-GCM opcional para endpoints sensibles
- **Forgot-password**: no revelar si el correo existe

## Decisiones de autenticación (Sprint 1, 2026-09-13)

Implementado en `auth/` + `users/`. Estas decisiones rigen todo el desarrollo futuro:

### Flujo obligatorio de verificación de correo
- Registro crea el usuario con `verificado = false` + `verification_token` (UUID, 24h de vida).
- El login **rechaza con 403** si el correo no está verificado (`CorreoNoVerificadoException`).
- Verificación vía `GET /api/v1/auth/verify-email?token=...`. Token de un solo uso: se limpia en BD al usarse.
- Solo correos `@elpoli.edu.co` (validación con `@Pattern` regex en DTOs).

### Tokens en la entidad Usuario (BD, no JWT)
- `verification_token` + `token_expiracion` (24h), `reset_token` + `reset_token_expiracion` (15 min), `cambio_token` + `cambio_token_expiracion` (15 min) + `contrasena_pendiente`.
- Todos los tokens son UUID, single-use, y se invalidan limpiando la columna tras uso exitoso.
- Un nuevo token sobrescribe el anterior (solo el último enlace es válido).

### Recuperación y cambio de contraseña
- `POST /auth/forgot-password`: siempre responde 200 con mensaje genérico; si el correo existe, genera `reset_token` y envía correo.
- `POST /auth/reset-password`: aplica nueva contraseña BCrypt con el `reset_token`.
- `POST /auth/change-password`: **requiere JWT** (`@AuthenticationPrincipal`), valida contraseña actual, rechaza si la nueva es igual a la actual, guarda `contrasena_pendiente` y envía confirmación.
- `GET /auth/confirm-password-change?token=...`: aplica `contrasena_pendiente`.

### Correo simulado
- `EmailService` **no envía correos reales**: escribe el enlace en logs con prefijo `[EMAIL SIMULADO]` (SLF4J).
- Los enlaces apuntan al **frontend** (`http://localhost:3000/...`), configurados en `application.yml` bajo `app.verification.base-url`, `app.reset.base-url`, `app.change-confirm.base-url`.
- Pendiente: reemplazar por SMTP real antes de producción.

### SecurityConfig
- Rutas públicas explícitas (lista blanca): `/register`, `/login`, `/verify-email`, `/forgot-password`, `/reset-password`, `/confirm-password-change`. **No** usar `permitAll()` sobre `/api/v1/auth/**` porque `change-password` requiere JWT.
- CSRF deshabilitado (API stateless con JWT).
- CORS habilitado solo para `http://localhost:3000` (origen del frontend en dev) en `/api/**`.
- Sin `AuthenticationProvider` bean manual: Spring Boot lo auto-configura desde `UserDetailsService` + `PasswordEncoder`.

### Contraseñas y roles
- Reglas de contraseña (espejo en frontend): 8-72 chars, mínimo 1 mayúscula, 1 minúscula, 1 número.
- Roles implementados: `ESTUDIANTE`, `TUTOR`, `ADMIN`. El registro asigna siempre `ESTUDIANTE`.
- Correos se normalizan a minúsculas y sin espacios antes de guardar/consultar.

## Excepciones
```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) { ... }
}
```

## DTOs - Siempre desacoplar
```java
// Nunca retornar la entidad directamente
@PostMapping
public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
    ...
}
```

## Perfiles Spring
- `application-dev.yml`: base de datos local, logging verbose
- `application-prod.yml`: base de datos producción, logging mínimo
- `application-test.yml`: base de datos de pruebas

## Reglas
- Sin comentarios ni emojis en el código
- Sin `System.out.println`, usar SLF4J
- Validar siempre con `@Valid`
- Retornar HTTP status codes correctos
