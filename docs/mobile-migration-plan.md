# Plan de Migración Móvil — tutorNow (Capacitor)

> **Estado**: Borrador v1 — pendiente de aprobación del equipo
> **Stack base**: Next.js 14.2 (App Router) + Tailwind CSS + Zustand + Spring Boot 3
> **Estrategia elegida**: Empaquetado de la SPA existente con Capacitor (no reescritura)
> **Plataforma inicial**: Android only (iOS queda como fase posterior vía servicio cloud o Mac prestado)
> **Última actualización**: 2026-11-13

---

## 1. Objetivo y alcance

Llevar la aplicación web tutorNow a iOS y Android como apps nativas publicables en App Store y Google Play, **reutilizando el 100% del código frontend existente** y sin modificar el backend Spring Boot.

### En alcance (v1 — Android)
- Empaquetado de la SPA Next.js con Capacitor para Android.
- Adaptaciones de UX móvil (safe areas, splash, status bar, deep linking, back button).
- Integración de plugins nativos estrictamente necesarios (persistencia, push, cámara).
- Pipeline de build y distribución para Android (Google Play).

### Fuera de alcance (v1)
- iOS / App Store (fase posterior, ver sección 12).
- Biometría (evaluar en v1.1).
- Offline-first completo (SQLite local).

### Fuera de alcance (por ahora)
- Reescritura en React Native / Flutter.
- Offline-first completo (SQLite local) — se evalúa en Fase 3.
- Notificaciones push transaccionales complejas (solo básicas en Fase 3).

---

## 2. Diagnóstico del estado actual

### 2.1 Frontend (Next.js)

| Aspecto | Estado | Implicación para Capacitor |
|---|---|---|
| Framework | Next.js 14.2 App Router | Requiere `output: 'export'` |
| Tipo de renderizado | 100% Client Components (`'use client'`) | ✅ Compatible con export estático |
| Server Components con data fetching | Ninguno | ✅ Sin bloqueo |
| API Routes (`route.ts`) | Ninguno | ✅ Sin bloqueo |
| Middleware (`middleware.ts`) | Ninguno | ✅ Sin bloqueo |
| `next.config.mjs` | Vacío | ⚠️ Hay que configurar export |
| Auth | Bearer token en Zustand + REST a Spring Boot | ✅ Funciona en WebView |
| Imágenes | `next/image` con `priority` en AuthLayout | ⚠️ Requiere `images.unoptimized: true` |
| Fuentes | `next/font/google` (Inter) | ⚠️ Se inlinan en build; OK para export |
| localStorage | Usado para tema (`tutornow-theme`) | ⚠️ Migrar a `@capacitor/preferences` |
| Navegación | `next/link`, `usePathname`, `useRouter` | ✅ Funciona en export estático |
| Estilos | Tailwind mobile-first, rem, safe areas parciales | ⚠️ Completar safe areas |

### 2.2 Backend (Spring Boot)

- **No requiere cambios**. La API REST ya es consumida vía HTTP por el frontend.
- La URL base se configura con `NEXT_PUBLIC_API_URL` (hoy `http://localhost:8080/api/v1`).
- En producción móvil, la app apuntará al backend desplegado (HTTPS obligatorio para iOS ATS).

### 2.3 Dependencias críticas a verificar

- `next/image` con `Image` component: en export estático necesita `unoptimized: true` o un loader custom.
- `next/font`: funciona en export, pero las fuentes se descargan en build time (requiere red en CI).
- Cualquier uso de `headers()`, `cookies()` de `next/headers`: **no existe en el código** (verificado por grep).

---

## 3. Estrategia: Capacitor como wrapper SPA

### 3.1 Decisión arquitectónica

**Capacitor envuelve el bundle estático de Next.js en un WebView nativo.** No es una reescritura: el código React, Tailwind y Zustand se ejecutan tal cual dentro del WebView.

```
┌─────────────────────────────────────┐
│  App nativa (Android/iOS)           │
│  ┌───────────────────────────────┐  │
│  │  Capacitor Runtime (JS bridge)│  │
│  │  ┌─────────────────────────┐  │  │
│  │  │  WebView                │  │  │
│  │  │  ├── Next.js SPA (out/) │  │  │
│  │  │  ├── Tailwind CSS       │  │  │
│  │  │  └── Zustand stores     │  │  │
│  │  └─────────────────────────┘  │  │
│  │  Plugins nativos (cámara,     │  │
│  │  push, preferences, etc.)     │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
         │ HTTP/HTTPS
         ▼
┌─────────────────────────────────────┐
│  Spring Boot (backend, sin cambios) │
└─────────────────────────────────────┘
```

### 3.2 Por qué Capacitor y no Expo/React Native

- La app es una SPA pura que consume REST. No hay lógica server-side en Next.
- Costo de migración: **días** (Capacitor) vs **semanas/meses** (Expo, reescritura de UI).
- Una sola codebase para web + móvil.
- El equipo ya domina React/TS/Tailwind; no hay curva de aprendizaje de RN.

### 3.3 Tradeoffs aceptados

- Performance de WebView (no 60fps nativos en animaciones complejas). Aceptable para CRUD, chat, listas.
- Cada cambio requiere `cap sync` + rebuild nativo (no hot reload como en web dev).
- Plugins nativos menos maduros que RN para features muy específicas.

---

## 4. Arquitectura objetivo (estructura de carpetas)

```
tutorNow/
├── backend/                    # Sin cambios
├── frontend/
│   ├── src/                    # Sin cambios (salvo adaptaciones menores)
│   ├── out/                    # Generado por `next build` (gitignored)
│   ├── capacitor.config.ts     # NUEVO
│   ├── android/                # Generado por `cap add android`
│   └── ios/                    # Generado por `cap add ios` (requiere Mac)
├── docs/
│   └── mobile-migration-plan.md
└── .github/workflows/
    ├── mobile-android.yml      # NUEVO (Fase 4)
    └── mobile-ios.yml          # NUEVO (Fase 4)
```

---

## 5. Fases de implementación

### Fase 0 — Preparación y auditoría (1-2 días)

**Objetivo**: confirmar que no hay bloqueos ocultos.

- [ ] Verificar que todas las páginas son `'use client'` (ya confirmado: 54 archivos, 0 server).
- [ ] Buscar usos de `next/headers`, `cookies()`, `headers()` → **ninguno** (verificado).
- [ ] Revisar `next/image`: listar todos los usos de `<Image>` y decidir `unoptimized: true` vs loader.
- [ ] Auditar `localStorage` / `sessionStorage`: migrar a `@capacitor/preferences`.
- [ ] Auditar dependencias de terceros que asumen entorno Node/browser específico.
- [ ] Definir URL de backend en producción (HTTPS) y agregar a config.
- [ ] Crear rama `feature/mobile-capacitor`.

**Criterio de salida**: checklist completo + rama creada.

### Fase 1 — Export estático + Capacitor base (3-5 días)

**Objetivo**: tener una app Android que muestre la SPA y pueda hacer login contra el backend.

#### 1.1 Configurar Next.js para export estático

Editar `frontend/next.config.mjs`:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Opcional: basePath si la app se sirve bajo subpath
};

export default nextConfig;
```

**Por qué `trailingSlash: true`**: Capacitor sirve archivos estáticos y las rutas client-side de Next funcionan mejor con trailing slash en entorno file://.

#### 1.2 Instalar Capacitor

```bash
cd frontend
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/ios
npx cap init tutornow com.tutornow.app --web-dir=out
```

#### 1.3 Crear `capacitor.config.ts`

```ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tutornow.app',
  appName: 'tutorNow',
  webDir: 'out',
  server: {
    // Solo para desarrollo: apuntar al dev server de Next
    // url: 'http://localhost:3000',
    // cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      showSpinner: false,
    },
  },
};

export default config;
```

#### 1.4 Scripts en `package.json`

```json
{
  "scripts": {
    "build:web": "next build",
    "build:mobile": "next build && npx cap sync",
    "cap:android": "npx cap open android"
  }
}
```

#### 1.5 Agregar plataforma Android

```bash
npx cap add android
```

> iOS se agrega en una fase posterior (sección 12) cuando haya Mac o servicio cloud disponible.

#### 1.6 Primer build y prueba

```bash
npm run build:mobile
npx cap open android   # abrir en Android Studio
```

**Criterio de salida**: app Android arranca, muestra login, puede hacer login contra backend local.

### Fase 2 — Adaptación móvil (1-2 semanas)

**Objetivo**: que la app se sienta nativa y no una web empaquetada.

#### 2.1 Safe areas y viewport

- Agregar en `globals.css`:
  ```css
  :root {
    --safe-area-top: env(safe-area-inset-top);
    --safe-area-bottom: env(safe-area-inset-bottom);
    --safe-area-left: env(safe-area-inset-left);
    --safe-area-right: env(safe-area-inset-right);
  }
  ```
- Actualizar `layout.tsx` (root) con `viewport-fit=cover`:
  ```tsx
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  ```
- Padding en Navbar y bottom bars usando `env(safe-area-inset-*)`.

#### 2.2 Splash screen y status bar

- Instalar `@capacitor/splash-screen`, `@capacitor/status-bar`.
- Configurar colores de status bar según tema (dark/light).
- Splash screen con logo de tutorNow.

#### 2.3 Persistencia (CRÍTICO)

- Instalar `@capacitor/preferences`.
- Crear un wrapper `lib/storage.ts` que use Preferences en nativo y localStorage en web:
  ```ts
  import { Preferences } from '@capacitor/preferences';
  import { Capacitor } from '@capacitor/core';

  export const storage = {
    async get(key: string) {
      if (Capacitor.isNativePlatform()) {
        const { value } = await Preferences.get({ key });
        return value;
      }
      return localStorage.getItem(key);
    },
    async set(key: string, value: string) {
      if (Capacitor.isNativePlatform()) {
        await Preferences.set({ key, value });
      } else {
        localStorage.setItem(key, value);
      }
    },
    async remove(key: string) {
      if (Capacitor.isNativePlatform()) {
        await Preferences.remove({ key });
      } else {
        localStorage.removeItem(key);
      }
    },
  };
  ```
- Migrar `useAuthStore` (token) y tema (`tutornow-theme`) a este storage.
- **Razón**: en iOS, el localStorage del WebView se borra bajo presión de memoria; Preferences persiste en Keychain/SharedPreferences.

#### 2.4 Deep linking

- Configurar scheme `tutornow://` en `capacitor.config.ts` (`server.url` no aplica; usar App plugin).
- Manejar rutas entrantes con `@capacitor/app` (`appUrlOpen` listener) → `router.push(path)`.
- Casos de uso: verificación de email, reset password, confirmación de cambio de contraseña.

#### 2.5 Keyboard handling

- Instalar `@capacitor/keyboard`.
- Ajustar inputs en formularios (login, registro, chat) para que no queden ocultos por el teclado.
- Usar `Keyboard.setAccessoryBarVisible` y `resize: 'body'` o `'ionic'`.

#### 2.6 Back button (Android)

- Manejar botón back físico con `@capacitor/app` (`backButton` listener).
- En rutas de dashboard: volver a home o salir. En modales: cerrar modal.

**Criterio de salida**: app se siente nativa (splash, safe areas, teclado no rompe forms, back button funciona).

### Fase 3 — Funcionalidades nativas críticas (2-3 semanas)

**Objetivo**: agregar capacidades que la web no tiene o que son pobres en WebView.

#### 3.1 Push notifications

- Instalar `@capacitor/push-notifications`.
- Registrar device token en el backend (nuevo endpoint en Spring Boot: `POST /api/v1/devices`).
- Backend envía vía FCM (Android) y APNs (iOS).
- **Requiere**: proyecto Firebase + certificado APNs.

#### 3.2 Cámara / galería (si aplica)

- Instalar `@capacitor/camera`.
- Usar en perfil de usuario (foto) y posiblemente en chat (envío de imágenes).
- Backend: endpoint de upload de archivos (multipart) si no existe.

#### 3.3 Biometría (opcional)

- Instalar `@capacitor-community/biometric-auth`.
- Desbloqueo de app con huella/FaceID, guardando token en Keychain/Keystore.

#### 3.4 Compartir

- Instalar `@capacitor/share` para compartir publicaciones de tutoría.

#### 3.5 Estado de red

- Instalar `@capacitor/network`.
- Mostrar banner "sin conexión" y deshabilitar acciones que requieren red.

**Criterio de salida**: push notifications funcionan en dispositivo real; cámara/biometría según scope acordado.

### Fase 4 — Build, CI/CD y distribución Android (1-2 semanas)

**Objetivo**: builds reproducibles y automatizados para Google Play.

#### 4.1 Android

- Configurar signing en `android/app/build.gradle` (keystore).
- GitHub Actions workflow:
  - Trigger: push a `main` o tag `v*`.
  - Steps: checkout → setup Node → `npm ci` → `npm run build:mobile` → setup JDK → `./gradlew bundleRelease` → upload AAB a Play Console (via `r0adkll/upload-google-play`).
- Requiere secrets: `ANDROID_KEYSTORE`, `ANDROID_KEYSTORE_PASSWORD`, `PLAY_SERVICE_ACCOUNT_JSON`.

#### 4.2 Versionado

- Sincronizar version entre `package.json` y `android/app/build.gradle` (`versionCode`, `versionName`).
- Script `scripts/bump-version.sh` para actualizar ambos.

**Criterio de salida**: pipeline verde en Android; iOS en TestFlight (al menos manualmente).

### Fase 5 — Testing y QA (continuo, ~1 semana dedicada)

- [ ] Smoke test en emulador Android (Pixel 6, API 33+).
- [ ] Smoke test en dispositivo real Android.
- [ ] Verificar flujos críticos: login, registro, verificación email, crear solicitud, chat, logout.
- [ ] Verificar deep links (email verification, reset password).
- [ ] Verificar push notifications end-to-end.
- [ ] Verificar comportamiento offline (banner, sin crash).
- [ ] Performance: tiempo de arranque < 3s en dispositivo mid-range.
- [ ] Tamaño del APK/AAB < 15MB (sin assets pesados).

---

## 6. Cambios requeridos en el código existente

| Archivo | Cambio | Fase |
|---|---|---|
| `frontend/next.config.mjs` | Agregar `output: 'export'`, `trailingSlash`, `images.unoptimized` | 1 |
| `frontend/package.json` | Agregar scripts de build mobile + deps de Capacitor | 1 |
| `frontend/src/app/layout.tsx` | Agregar `viewport-fit=cover` | 2 |
| `frontend/src/app/globals.css` | Safe area variables | 2 |
| `frontend/src/stores/useAuthStore.ts` | Migrar persistencia a `@capacitor/preferences` | 2 |
| `frontend/src/lib/storage.ts` | **NUEVO** — wrapper de storage | 2 |
| `frontend/src/components/layout/Navbar.tsx` | Safe area padding | 2 |
| `backend` (nuevo endpoint) | `POST /api/v1/devices` para push tokens | 3 |

**Principio**: cambios mínimos y aditivos. No se toca la lógica de negocio.

---

## 7. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| `next/image` rompe en export | Baja | Medio | `images.unoptimized: true` |
| Fuentes Google no disponibles en build offline | Baja | Bajo | Cachear en CI o self-host |
| Teclado cubre inputs en chat | Alta | Medio | `@capacitor/keyboard` + CSS |
| App rechazada por Google Play (WebView "genérica") | Media | Alto | Agregar features nativas (push, cámara) para justificar app nativa |
| Tamaño del bundle > 15MB | Baja | Medio | Analizar bundle con `@next/bundle-analyzer`; lazy loading |
| Backend sin HTTPS en producción | Alta | Alto | Configurar TLS en Spring Boot antes de release (necesario también para iOS futuro) |

---

## 8. Criterios de aceptación por fase

- **Fase 0**: checklist de auditoría completo, rama creada.
- **Fase 1**: app Android arranca, login funciona contra backend local, navegación entre rutas OK.
- **Fase 2**: splash + safe areas + teclado + back button + persistencia de sesión entre reinicios.
- **Fase 3**: push notifications recibidas en dispositivo real; cámara funcional si aplica.
- **Fase 4**: pipeline Android verde (AAB subido a Play Console).
- **Fase 5**: smoke tests pasan en emulador + dispositivo Android real; arranque < 3s.

---

## 9. Estimación de esfuerzo

| Fase | Esfuerzo | Dependencias |
|---|---|---|
| Fase 0 | 1-2 días | Ninguna |
| Fase 1 | 3-5 días | Fase 0 |
| Fase 2 | 1-2 semanas | Fase 1 |
| Fase 3 | 2-3 semanas | Fase 2 + backend |
| Fase 4 | 1-2 semanas | Fase 1 (Android), Mac (iOS) |
| Fase 5 | ~1 semana | Todas |

**Total estimado (Android v1)**: 5-7 semanas (1 desarrollador full-time). iOS se suma cuando haya Mac/servicio cloud (ver sección 12).

---

## 10. Decisiones pendientes

1. **¿Qué features nativas son obligatorias para v1?** (cámara, push) — afecta scope de Fase 3. Biometría queda para v1.1.
2. **¿Backend en producción tiene HTTPS?** Necesario para push notifications y futuro iOS.
3. **¿Se quiere PWA como fallback web?** Compatible con esta estrategia (mismo bundle).
4. **Nombre del package**: propuesto `com.tutornow.app` — confirmar.
5. **¿iOS en v1.1 o v2?** Ver sección 12.

---

## 11. Próximos pasos inmediatos

1. Aprobar este plan (o ajustar scope).
2. Crear rama `feature/mobile-capacitor`.
3. Ejecutar Fase 0 (auditoría) — ya mayormente hecha en la exploración.
4. Configurar `next.config.mjs` (Fase 1.1) y hacer el primer `next build` con `output: 'export'`.
5. Instalar Capacitor y generar proyecto Android.

---

## 12. iOS — fase posterior (cuando haya Mac o servicio cloud)

iOS no está en el scope de v1. Cuando el producto esté validado en Android, se puede agregar iOS de dos formas:

### Opción A — Mac prestado (recomendada, costo $0)
1. Pedir un Mac prestado una única vez.
2. Instalar Xcode, generar el certificado de distribución y el provisioning profile de Apple (requiere Apple Developer Program, USD 99/año).
3. Subir certificado + perfil a GitHub Secrets.
4. Agregar job `macos-latest` al workflow de CI para builds automáticos a TestFlight.

### Opción B — Servicio cloud (Codemagic / Ionic Appflow)
- Permite builds iOS desde Windows sin Mac propio.
- Costo: ~USD 30-50/mes según plan.
- Ideal si no hay Mac disponible ni se quiere depender de préstamos.

### Pasos cuando se decida agregar iOS
1. `npx cap add ios` (en una Mac o en el servicio cloud).
2. Agregar plugin `@capacitor/ios` y configurar `capacitor.config.ts` con `ios.scheme`.
3. Verificar safe areas en iPhone (notch, Dynamic Island).
4. Testing en simulador + dispositivo real.
5. Subir a TestFlight → App Store review.

### Bloqueos de Apple a tener en cuenta
- Apple Developer Program obligatorio (USD 99/año).
- Revisión de App Store puede rechazar apps que sean solo WebView sin features nativas → por eso v1 Android ya incluye push/cámara.
- iOS ATS exige HTTPS al backend.

## Referencias

- Capacitor docs: https://capacitorjs.com/docs
- Next.js static export: https://nextjs.org/docs/app/building-your-application/deploying/static-exports
- Plugins oficiales: https://capacitorjs.com/docs/plugins
- Apple App Store guidelines (WebView apps): sección 4.2
- Google Play policies (minimum functionality): https://support.google.com/googleplay/android-developer/answer/9888170
