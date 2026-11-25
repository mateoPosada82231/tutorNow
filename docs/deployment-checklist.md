# Guía de despliegue y cambios post-despliegue — tutorNow

> **Objetivo**: tener en un solo lugar todo lo que hay que revisar antes, durante y después de desplegar tutorNow (web, backend, Android e iOS).
> **Estado actual**: frontend Next.js con export estático + Capacitor; backend Spring Boot + PostgreSQL; Android e iOS compilados en GitHub Actions; iOS instalado por sideload.
> **Última actualización**: 2026-11-15

---

## 1. Arquitectura de despliegue

| Componente | Dónde se ejecuta | Cómo se despliega |
|---|---|---|
| Frontend web | Hosting estático (Vercel/Netlify/GitHub Pages) | `npm run build:web` → subir `frontend/out` |
| Backend | Servidor/Paas con HTTPS | `mvn package` + variables de entorno |
| Base de datos | PostgreSQL 15+ (Neon/Supabase/RDS/local) | Flyway migra al arrancar |
| Android | APK/AAB | GitHub Actions → `app-debug.apk` o `bundleRelease` |
| iOS | IPA unsigned + sideload | GitHub Actions → artifact `.ipa` |

---

## 2. Variables y secretos

### Frontend

| Variable | Dónde | Valor |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Build web y GitHub Secrets (`BACKEND_URL`) | URL HTTPS del backend, ej. `https://api.tutornow.com/api/v1` |

> La URL queda **embebida en el build**. Si cambia, hay que rebuildear web, Android e iOS.

### Backend

| Variable | Obligatoria | Nota |
|---|---|---|
| `DB_URL` | Sí | `jdbc:postgresql://host:5432/tutornow` |
| `DB_USERNAME` | Sí | Usuario de la base |
| `DB_PASSWORD` | Sí | Contraseña de la base |
| `JWT_SECRET` | Sí | **Cambiar el valor de desarrollo** por uno seguro y largo |
| `app.verification.base-url` | Sí | URL del frontend desplegado |
| `app.reset.base-url` | Sí | URL del frontend desplegado |
| `app.change-confirm.base-url` | Sí | URL del frontend desplegado |

Archivo actual: `backend/src/main/resources/application.yml` y `application-dev.yml`.

### GitHub Secrets

| Secret | Uso |
|---|---|
| `BACKEND_URL` | Workflows Android e iOS (URL del backend) |
| `ANDROID_KEYSTORE` | Base64 del keystore release Android |
| `ANDROID_KEYSTORE_PASSWORD` | Contraseña del keystore |
| `ANDROID_KEY_PASSWORD` | Contraseña del alias de la key |
| `ANDROID_KEY_ALIAS` | Alias de la key (ej. `tutornow`) |
| `PLAY_SERVICE_ACCOUNT_JSON` | Publicación Google Play (service account) |

Variable de repositorio (no secret):

| Variable | Uso |
|---|---|
| `UPLOAD_TO_PLAY` | `true` para subir el AAB automáticamente a Play Console |

> Nunca commitear `.env`, keystores ni contraseñas.

---

## 3. Backend: checklist de despliegue

- [ ] Crear base de datos PostgreSQL 15+ y usuario dedicado.
- [ ] Configurar `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`.
- [ ] Generar un `JWT_SECRET` nuevo (no usar el default de desarrollo).
- [ ] Configurar HTTPS (ver sección 4).
- [ ] Actualizar las URL base de correos:
  - `app.verification.base-url`
  - `app.reset.base-url`
  - `app.change-confirm.base-url`
- [ ] Actualizar CORS en `SecurityConfig.java`:
  - Agregar el dominio real del frontend (`https://tutornow...`).
  - Mantener `capacitor://localhost` (iOS) y `http://localhost` (Android).
  - Quitar orígenes que no se usen.
- [ ] Verificar que Flyway corra las migraciones al arrancar.
- [ ] Probar `GET /actuator/health` si está habilitado.
- [ ] Probar login, registro, verificación y reset contra la base real.
- [ ] Configurar backup automático de la base.

### Correos

Hoy el envío es **simulado en logs** (`[EMAIL SIMULADO]`). Antes de producción real:

- [ ] Integrar proveedor de correo (SMTP, SendGrid, Resend, etc.).
- [ ] Configurar SPF/DKIM del dominio.
- [ ] Cambiar las URL base de correos al dominio del frontend.

---

## 4. HTTPS y certificados

| Escenario | Solución | Costo |
|---|---|---|
| PaaS (Render/Fly/Railway/Vercel) | HTTPS automático | $0 en free tier |
| VPS propio | Certbot + Let's Encrypt | $0 |
| Pruebas locales | ngrok / Cloudflare Tunnel | $0 |

**Certbot** requiere dominio propio y puertos 80/443 abiertos. **CertKit** es una plataforma de gestión de certificados (orientada a empresas/Windows/IIS); no es necesaria para este proyecto.

### ATS de iOS

Mientras el backend sea HTTP, `frontend/ios/App/App/Info.plist` tiene:

```xml
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsArbitraryLoads</key>
  <true/>
</dict>
```

**Al pasar a HTTPS hay que eliminar ese bloque.** Apple rechaza apps con esa excepción en App Store.

### Android

`frontend/capacitor.config.ts` usa:

```ts
server: {
  androidScheme: 'http',
  cleartext: true,
}
```

Para producción conviene pasar a `androidScheme: 'https'` y quitar `cleartext`, o al menos verificar que no quede tráfico HTTP.

---

## 5. Frontend: checklist de despliegue web

- [ ] Configurar `NEXT_PUBLIC_API_URL` con HTTPS.
- [ ] Ejecutar `npm run build:web`.
- [ ] Publicar `frontend/out` en el hosting.
- [ ] Verificar que las rutas con `trailingSlash` funcionen.
- [ ] Probar login, navegación, detalle de asesoría, chat y perfil.
- [ ] Verificar CORS desde el dominio real.
- [ ] Verificar que los correos de verificación/reset apunten al dominio correcto.

### Restricción crítica: rutas estáticas

El export estático **no genera rutas dinámicas**. Por eso las pantallas de detalle usan query params:

- `/tutoring/requests/detail?id=123`
- `/tutoring/tutors/detail?id=456`
- `/tutoring/chats?chat=789`

**No volver a usar** `[id]`, `[tutorId]` ni `[asesoriaId]` en el App Router si la app se empaqueta con Capacitor. Si se agrega una pantalla de detalle nueva, debe ser estática + query param.

---

## 6. Android: checklist

### Debug (pruebas)

- [ ] Configurar `BACKEND_URL`.
- [ ] Correr workflow **Android Build (Debug)**.
- [ ] Descargar `app-debug-apk`.
- [ ] Instalar en dispositivo (`adb install -r app-debug.apk`).
- [ ] Probar login, detalle de asesoría, chat, tema y navegación.

### Release (Google Play)

Automatizado con `.github/workflows/android-release.yml` (ejecución manual `workflow_dispatch`).

- [ ] Generar keystore y guardarlo fuera del repo:
  ```bash
  keytool -genkey -v -keystore tutornow-release.keystore -alias tutornow \
    -keyalg RSA -keysize 2048 -validity 10000
  ```
- [ ] Convertir el keystore a base64 y cargarlo en el secret `ANDROID_KEYSTORE`:
  ```powershell
  [Convert]::ToBase64String([IO.File]::ReadAllBytes("ruta\tutornow-release.keystore")) | Set-Clipboard
  ```
- [ ] Configurar `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_PASSWORD` y `ANDROID_KEY_ALIAS`.
- [ ] Correr el workflow **Android Release (AAB)** con `versionCode` (+1 cada release) y `versionName`.
- [ ] Descargar el artifact `app-release-aab` (o dejar que suba solo con `UPLOAD_TO_PLAY=true`).
- [ ] Subirlo a Play Console (Internal testing primero) o dejar que `r0adkll/upload-google-play` lo suba.
- [ ] Ajustar `versionCode` y `versionName` en cada release (el workflow los recibe como input).
- [ ] Completar ficha de tienda, política de privacidad y clasificación.
- [ ] Promover de Internal testing a Production cuando los smoke tests pasen.

> Firma con Play App Signing: Google firma el APK final; tu keystore es el "upload key".
> Nunca commitear `keystore.properties`, el `.keystore` ni `.jks` (ya están en `.gitignore`).

---

## 7. iOS: checklist

### Pruebas actuales (sideload, $0)

- [ ] Configurar `BACKEND_URL` (HTTP por ahora).
- [ ] Correr workflow **iOS Build (unsigned)**.
- [ ] Descargar `app-unsigned-ipa`.
- [ ] Instalar con Sideloadly/AltStore usando Apple ID gratuito.
- [ ] Confiar en el desarrollador en Ajustes.
- [ ] Probar login, detalle, chat, tema, About y botón Volver.

### Limitaciones del sideload

- La firma expira a los **7 días**.
- Máximo **3 apps** por Apple ID gratuito.
- Sin push notifications (APNs).
- Sin TestFlight ni App Store.
- Refrescar con AltServer/Sideloadly cada semana.

### App Store / TestFlight (futuro, $99/año)

- [ ] Apple Developer Program.
- [ ] Certificados y provisioning profiles.
- [ ] `npx cap add ios` ya está hecho; configurar signing en Xcode.
- [ ] Subir a TestFlight → App Store.
- [ ] Apple puede rechazar apps que sean solo WebView (guideline 4.2); agregar features nativas.
- [ ] Eliminar la excepción ATS antes de enviar.

---

## 8. Cambios obligatorios al desplegar el backend (HTTP → HTTPS)

Esta es la lista que hay que ejecutar cuando el backend pase a producción:

1. [ ] Desplegar backend con HTTPS.
2. [ ] Actualizar `BACKEND_URL` en GitHub Secrets al dominio HTTPS.
3. [ ] Actualizar `NEXT_PUBLIC_API_URL` en el hosting web.
4. [ ] Eliminar `NSAppTransportSecurity` de `frontend/ios/App/App/Info.plist`.
5. [ ] Revisar `capacitor.config.ts` (Android: `androidScheme`/`cleartext`).
6. [ ] Agregar el dominio del frontend a CORS en `SecurityConfig.java`.
7. [ ] Actualizar `app.verification.base-url`, `app.reset.base-url` y `app.change-confirm.base-url`.
8. [ ] Rebuild de web, Android e iOS.
9. [ ] Reinstalar apps y repetir smoke tests.
10. [ ] Verificar que no queden URLs `http://` ni `localhost` en el build.
11. [ ] Verificar que los correos apunten al dominio correcto.
12. [ ] Rotar `JWT_SECRET` si estuvo expuesto.

---

## 9. Versionado

| Plataforma | Dónde |
|---|---|
| Frontend | `frontend/package.json` (`version`) |
| Android | `frontend/android/app/build.gradle` (`versionCode`, `versionName`) |
| iOS | `frontend/ios/App/App.xcodeproj/project.pbxproj` (`MARKETING_VERSION`, `CURRENT_PROJECT_VERSION`) |

Recomendación: mantener la misma versión semántica en las tres plataformas y subir `versionCode`/`CURRENT_PROJECT_VERSION` en cada release.

---

## 10. Smoke tests mínimos (post-deploy)

- [ ] Registro con correo institucional.
- [ ] Verificación de correo.
- [ ] Login/logout.
- [ ] Persistencia de sesión al navegar y al reiniciar la app.
- [ ] Crear solicitud de asesoría.
- [ ] Ver detalle de asesoría.
- [ ] Enviar propuesta (tutor).
- [ ] Aceptar/rechazar propuesta (estudiante).
- [ ] Chat.
- [ ] Cambio de tema claro/oscuro.
- [ ] About → Volver.
- [ ] Safe area en iPhone (Dynamic Island) y Android (notch).
- [ ] Ícono de la app.

---

## 11. Rollback

- **Backend**: mantener la versión anterior del jar/imagen y la migración Flyway compatible.
- **Base de datos**: backup antes de cada migración; no borrar columnas en el mismo release.
- **Web**: el hosting permite volver al deployment anterior.
- **Android/iOS**: conservar el artifact anterior; reinstalar si el nuevo falla.
- **Secrets**: no rotar `JWT_SECRET` sin avisar (invalida sesiones activas).

---

## 12. Riesgos conocidos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Export estático sin rutas dinámicas | Alto | Usar query params (ya implementado) |
| Backend HTTP en iOS | Alto | ATS exception temporal; pasar a HTTPS |
| CORS sin dominio de producción | Alto | Actualizar `SecurityConfig` |
| `JWT_SECRET` de desarrollo | Alto | Rotar en producción |
| Firma iOS expira a los 7 días | Medio | AltServer/Sideloadly |
| localStorage puede purgarse en WebView | Medio | Migrar a `@capacitor/preferences` (pendiente) |
| Push notifications sin Apple Developer | Medio | Requiere $99/año |
| App Store rechaza WebView pura | Medio | Agregar features nativas antes de publicar |
| Minutos macOS de GitHub Actions | Bajo | Ejecutar workflow manualmente |

---

## 13. Pendientes técnicos recomendados

- [ ] Migrar persistencia de auth/tema a `@capacitor/preferences`.
- [ ] Configurar deep links (`tutornow://`) para verificación/reset.
- [ ] Agregar splash screen con logo.
- [ ] Configurar push notifications (requiere APNs/FCM y Apple Developer).
- [ ] Agregar tests E2E mobile (Detox/Appium o Playwright web).
- [ ] Configurar monitoreo de errores (Sentry).
- [ ] Configurar backups automáticos de PostgreSQL.
- [ ] Documentar proceso de refresh de firma iOS para el equipo.

---

## 14. Referencias

- Plan móvil: `docs/mobile-migration-plan.md`
- Plan iOS: `docs/ios-deployment-plan.md`
- Workflows: `.github/workflows/android.yml`, `.github/workflows/ios.yml`
- Capacitor config: `frontend/capacitor.config.ts`
- CORS: `backend/src/main/java/co/edu/epi/tutornow/auth/config/SecurityConfig.java`
- Config backend: `backend/src/main/resources/application.yml`
