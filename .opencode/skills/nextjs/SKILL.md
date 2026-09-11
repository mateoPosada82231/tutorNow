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
- Token vive SOLO en `useAuthStore` con persist
- HttpClient lee vía `useAuthStore.getState().token`
- Sin escrituras manuales a `localStorage`
- Sin key `token` suelto

## TypeScript
- Tipar todo: props, state, API responses
- Interfaces para DTOs de API
- No usar `any`
- Barrel exports en `index.ts` de cada feature

## Reglas
- Sin comentarios ni emojis en el código
- Commits atómicos y Conventional Commits
- Nunca commitear `.env`
