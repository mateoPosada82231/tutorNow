import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tutornow.app',
  appName: 'tutorNow',
  webDir: 'out',
  server: {
    // Capacitor defaults to androidScheme: 'https', which makes the WebView
    // serve the app from https://localhost. Fetching a plain http:// backend
    // from an https origin is blocked by Android WebView as mixed content,
    // surfacing as "TypeError: Failed to fetch" with no status code.
    // Using 'http' keeps the WebView origin and the backend on the same scheme.
    androidScheme: 'http',
    cleartext: true,
    // Keep the default iOS scheme (`capacitor://localhost`). A custom
    // `ios.scheme` changes the WebView origin (e.g. `App://localhost`), which
    // the backend CORS allowlist rejects with 403 "Invalid CORS request".
  },
  // Descomentar para desarrollo con hot reload contra el dev server de Next:
  // server: {
  //   url: 'http://10.0.2.2:3000',
  //   cleartext: true,
  // },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#ffffff',
    },
  },
};

export default config;
