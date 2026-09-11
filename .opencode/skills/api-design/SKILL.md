---
name: api-design
description: Use when designing or reviewing REST API endpoints for tutorNow. Covers RESTful conventions, versioning, HTTP status codes, pagination, naming, and request/response patterns.
---

# API Design Conventions - tutorNow

## Base URL
```
/api/v1
```

## Resource Naming
- Plural nouns: `/users`, `/tutoring-requests`, `/proposals`
- Kebab-case para recursos compuestos: `/tutoring-requests`, `/auth/forgot-password`
- Nesting para relaciones: `/tutoring-requests/{id}/proposals`

## Endpoints principales

### Auth
```
POST   /api/v1/auth/register          # Registro
POST   /api/v1/auth/login             # Login
POST   /api/v1/auth/refresh           # Refresh token
POST   /api/v1/auth/forgot-password   # Solicitar reset
POST   /api/v1/auth/reset-password    # Reset con token
GET    /api/v1/auth/google            # OAuth2 Google
GET    /api/v1/auth/facebook          # OAuth2 Facebook
```

### Users
```
GET    /api/v1/users/me               # Perfil propio
PUT    /api/v1/users/me               # Actualizar perfil
GET    /api/v1/users/{id}             # Perfil público (si está permitido)
```

### Tutoring Requests (Solicitudes)
```
GET    /api/v1/tutoring-requests           # Listar (con filtros)
POST   /api/v1/tutoring-requests           # Crear solicitud
GET    /api/v1/tutoring-requests/{id}      # Detalle
PUT    /api/v1/tutoring-requests/{id}      # Actualizar
DELETE /api/v1/tutoring-requests/{id}      # Cancelar
GET    /api/v1/tutoring-requests/{id}/proposals  # Propuestas de una solicitud
```

### Proposals (Propuestas)
```
POST   /api/v1/proposals                   # Enviar propuesta
GET    /api/v1/proposals/{id}              # Detalle
PUT    /api/v1/proposals/{id}/accept       # Aceptar propuesta
PUT    /api/v1/proposals/{id}/reject       # Rechazar propuesta
```

### Schedule (Agenda)
```
GET    /api/v1/schedule/slots              # Mis slots disponibles
POST   /api/v1/schedule/slots              # Crear slot
DELETE /api/v1/schedule/slots/{id}         # Eliminar slot
```

### Reviews (Resenas)
```
POST   /api/v1/reviews                     # Crear reseña
GET    /api/v1/reviews/user/{userId}       # Resenas de un usuario
```

### Chat
```
GET    /api/v1/chats                       # Mis chats activos
GET    /api/v1/chats/{id}                  # Mensajes del chat
POST   /api/v1/chats/{id}/messages         # Enviar mensaje
```

### Admin
```
GET    /api/v1/admin/users                 # Listar usuarios
PUT    /api/v1/admin/users/{id}/block      # Bloquear usuario
GET    /api/v1/admin/reports               # Ver reportes
PUT    /api/v1/admin/reviews/{id}/remove   # Retirar reseña
```

## HTTP Status Codes
| Código | Uso |
|--------|-----|
| 200 | OK - Operación exitosa |
| 201 | Created - Recurso creado |
| 204 | No Content - Eliminación exitosa |
| 400 | Bad Request - Validación fallida |
| 401 | Unauthorized - No autenticado |
| 403 | Forbidden - Sin permisos / ownership mismatch |
| 404 | Not Found - Recurso no existe |
| 409 | Conflict - Conflicto (ej: correo ya registrado) |
| 429 | Too Many Requests - Rate limiting |

## Request Body
```json
// POST /api/v1/auth/register
{
  "email": "estudiante@elpoli.edu.co",
  "password": "SecurePass123!",
  "fullName": "Juan Pérez",
  "program": "Ingeniería de Sistemas",
  "semester": 5
}
```

## Response Pattern
```json
// Éxito (objeto)
{
  "id": 1,
  "email": "estudiante@elpoli.edu.co",
  "fullName": "Juan Pérez",
  "role": "USER"
}

// Éxito (lista con paginación)
{
  "data": [...],
  "pagination": {
    "page": 0,
    "size": 10,
    "totalElements": 45,
    "totalPages": 5
  }
}

// Error
{
  "status": 400,
  "error": "Validation Error",
  "message": "El correo electrónico ya está registrado",
  "timestamp": "2026-09-11T16:30:00Z"
}
```

## Paginación
- Query params: `?page=0&size=10&sort=created_at,desc`
- Default: `page=0`, `size=10`, `sort=created_at,desc`

## Filtrado
```
GET /api/v1/tutoring-requests?asignatura=Matematicas&estado=PUBLICADA&modalidad=VIRTUAL
```

## Autenticación
- Header: `Authorization: Bearer {token}`
- Todos los endpoints autenticados excepto: register, login, forgot-password

## Rate Limiting
- Auth endpoints: 5 requests/min por IP
- Otros endpoints: definir según necesidad
- Headers de rate limit en respuesta:
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1694438400
```

## Reglas
- Siempre versionar la API (`/api/v1/`)
- Nunca exponer detalles internos en errores
- DTOs para request/response, nunca entidades
- Ownership verification en endpoints protegidos
- Sin comentarios ni emojis
