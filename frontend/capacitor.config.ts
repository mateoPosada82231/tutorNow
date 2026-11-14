import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tutornow.app',
  appName: 'tutorNow',
  webDir: 'out',
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
