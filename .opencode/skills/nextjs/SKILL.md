---
name: nextjs
description: Use when writing or reviewing Next.js frontend code for tutorNow. Covers App Router, Server/Client Components, feature-based structure, data fetching, and TypeScript conventions.
---

# Next.js Conventions - tutorNow

## Stack
- Next.js 14+ (App Router)
- React 18+
- TypeScript
- Zustand (state management)

## Estructura de carpetas (Feature-based)
```
src/
├── app/                        # App Router pages
│   ├── (auth)/                 # Grupo de rutas auth (login, register)
│   ├── (dashboard)/            # Grupo de rutas del dashboard
│   │   ├── tutoring/
│   │   ├── profile/
│   │   └── admin/
│   ├── layout.tsx
│   ├── page.tsx
│   └── not-found.tsx
├── features/                   # Features por dominio
│   ├── auth/
│   │   ├── components/         # Componentes del feature
│   │   ├── hooks/              # Hooks custom del feature
│   │   ├── types/              # Types del feature
│   │   └── api/                # Funciones de llamada a API
│   ├── tutoring/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── types/
│   ├── profile/
│   ├── reviews/
│   └── admin/
├── components/                 # Componentes compartidos
│   ├── ui/                     # Base UI components (Button, Input, Card, etc.)
│   └── layout/                 # Layout components (Header, Sidebar, etc.)
├── lib/                        # Utilidades
│   ├── httpClient.ts           # Axios/fetch instance
│   ├── config.ts               # Configuración global
│   └── utils.ts                # Helpers
├── hooks/                      # Hooks globales
├── stores/                     # Zustand stores
│   ├── useAuthStore.ts
│   └── useContentStore.ts
└── types/                      # Tipos globales
```

## Server vs Client Components
- **Server Components** por defecto (sin `"use client"`)
- **Client Components** solo cuando se necesite:
  - `useState`, `useEffect`, `useReducer`
  - Event handlers (`onClick`, `onChange`)
  - Browser APIs (`localStorage`, `window`)
  - Hooks personalizados que usen client-side state

```tsx
// Solo agregar "use client" cuando sea estrictamente necesario
"use client"
export function LoginButton() { ... }
```

## Data Fetching
- Server-side por defecto en page components
- Client-side con `fetch` o custom hooks para datos dinámicos
- SWR o React Query para cache y revalidación si es necesario

## Contenido dinámico
- TODO texto visible pasa por `useContent()` / `useConfig()`
- Incluye ARIA labels, placeholders, mensajes de error
```tsx
const { t } = useContent()
<input aria-label={t('auth.email.placeholder')} />
```

## User Feedback obligatorio
- **Loading states**: skeleton loaders, spinners
- **Empty states**: mensaje ilustrativo + CTA
- **Error states**: mensaje de error + botón retry
- **Transiciones**: animaciones suaves entre estados

## Componentes
- Reutilizar de `components/ui/` siempre que sea posible
- Nunca redefinir estilos de componentes existentes, solo agregar clases de layout
- Naming: PascalCase (`UserProfile`, `TutoringRequestCard`)
- Hooks: camelCase con prefijo `use` (`useTutoringRequests`)

## Zustand Stores
```typescript
// stores/useAuthStore.ts
interface AuthState {
  token: string | null
  user: User | null
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => void
}
```
- Token vive SOLO en `useAuthStore` con persist (localStorage key: `tutornow-auth`)
- HttpClient lee vía `useAuthStore.getState().token`
- Sin escrituras manuales a `localStorage`
- Sin key `token` suelto

## Decisiones de la implementación auth (Sprint 1, 2026-09-13)

Implementado en `features/auth/` + grupos de ruta `(auth)` y `(dashboard)`:

### httpClient (`src/lib/httpClient.ts`)
- Wrapper sobre `fetch` con base URL de `NEXT_PUBLIC_API_URL` (default `http://localhost:8080/api/v1`)
- Opción `{ auth: true }` inyecta `Authorization: Bearer` leyendo `useAuthStore.getState().token`
- Errores se lanzan como `HttpError(status, message, errors?)` parseando el `ErrorResponse` del backend; los formularios mapean `err.errors` a campos de input

### Rutas y protección
- `(auth)`: `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`, `/confirm-password-change`. Layout compartido `AuthLayout` (tarjeta centrada mobile-first)
- `(dashboard)`: `/dashboard`, `/settings/password`. Protegidas con el hook global `src/hooks/useRequireAuth.ts` (client-side: sin token redirige a `/login`)
- `/` (raíz) redirige a `/login` — el login es la puerta de entrada porque exige correo verificado
- Enlaces de correo apuntan al frontend `:3000`; las páginas `verify-email`, `reset-password` y `confirm-password-change` leen `searchParams.token` y llaman al backend. Patrón reutilizable: `ConfirmationStatus` (loading/success/error)

### Validación espejo
- `features/auth/hooks/validation.ts` replica las reglas del backend: regex de `@elpoli.edu.co` y reglas de contraseña (8+ chars, mayúscula, minúscula, número). Validar en cliente Y servidor

### Flujos de UX acordados
- Registro exitoso NO loguea: muestra "revisa tu correo" + CTA a login
- Login con 403 muestra aviso de correo no verificado (no autorrellena)
- forgot-password siempre muestra éxito genérico (el backend no revela si el correo existe)
- Cambio de contraseña es de 2 pasos: form autenticado genera correo de confirmación; el cambio se aplica al hacer clic en el enlace

## TypeScript
- Tipar todo: props, state, API responses
- Interfaces para DTOs de API
- No usar `any`
- Barrel exports en `index.ts` de cada feature

## Reglas
- Sin comentarios ni emojis en el código
- Commits atómicos y Conventional Commits
- Nunca commitear `.env`
