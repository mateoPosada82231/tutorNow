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
