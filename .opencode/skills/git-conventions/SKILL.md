---
name: git-conventions
description: Use when creating branches, writing commits, or managing PRs for tutorNow. Covers branch naming, conventional commits, PR workflow, and .gitignore rules.
---

# Git Conventions - tutorNow

## Branch Naming
```
feature/{descripcion}     # Nuevas funcionalidades
fix/{descripcion}         # Corrección de bugs
refactor/{descripcion}    # Refactorización sin cambio de comportamiento
chore/{descripcion}       # Tareas de mantenimiento
docs/{descripcion}        # Documentación
test/{descripcion}        # Tests
```

### Ejemplos
```
feature/auth-register
feature/tutoring-request-list
fix/proposal-acceptance-flow
refactor/user-entity-dto
chore/update-dependencies
docs/api-endpoints
test/auth-service
```

## Conventional Commits

### Formato
```
tipo(alcance): descripción corta

[opcional: cuerpo con más detalle]

[opcional: footer con refs]
```

### Tipos
| Tipo | Uso | Ejemplo |
|------|-----|---------|
| `feat` | Nueva funcionalidad | `feat(auth): add Google OAuth2 login` |
| `fix` | Corrección de bug | `fix(proposals): fix acceptance flow` |
| `refactor` | Refactorización | `refactor(users): extract DTO mapping` |
| `chore` | Tareas de mantenimiento | `chore: update Spring Boot to 3.2` |
| `docs` | Documentación | `docs: add API endpoints reference` |
| `test` | Tests | `test(auth): add login validation tests` |
| `style` | Formato de código | `style: apply code formatting` |
| `perf` | Mejora de rendimiento | `perf queries: optimize user search` |

### Reglas de commits
- **Atómicos**: un commit = un cambio lógico
- **Descriptivos**: la descripción explica QUÉ y POR QUÉ
- **Sin emoji** a menos que se pida explícitamente
- **Sin punto final** en la descripción corta
- **Max 72 caracteres** en la primera línea

### Ejemplos
```
feat(auth): implement JWT token generation

- Add JwtTokenProvider with configurable expiration
- Include type claim (ACCESS, RESET, BETA)
- Add token revocation list support

Closes #23
```

```
fix(tutoring): prevent duplicate proposals from same user

Fixes #45
```

```
chore: add .env to .gitignore
```

## Pull Requests

### Tamaño
- PRs pequeños y enfocados (máx ~300 líneas de diff ideal)
- Un PR = una funcionalidad o corrección
- Si es grande, dividir en PRs secuenciales

### Título
Mismo formato que conventional commits:
```
feat(auth): implement registration flow
fix(profile): fix avatar upload error
```

### Descripción
```markdown
## Descripción
Breve descripción de qué hace este PR y por qué.

## Cambios
- Add registration endpoint with email validation
- Add registration form component
- Add form validation with error states

## Testing
- [ ] Tested registration flow end-to-end
- [ ] Tested error cases (duplicate email, invalid data)
- [ ] Tested mobile responsiveness

## Screenshots (si aplica)
```

### Antes de merge
- [ ] Code review aprobado
- [ ] Tests pasando
- [ ] No hay secrets o credenciales
- [ ] Build exitoso
- [ ] No hay conflictos con la rama base

## .gitignore
```
# Environment
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Dependencies
node_modules/
vendor/
target/
build/
dist/

# Logs
*.log
npm-debug.log*
```

## Reglas
- **Nunca** commitear `.env` o credenciales
- **Siempre** hacer pull antes de push
- **Siempre** crear PR para cambios en develop/main
- **Nunca** hacer force push en ramas compartidas
- Commits atómicos: un cambio lógico por commit
