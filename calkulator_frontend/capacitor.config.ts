import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mmarosz.calkulator',
  appName: 'calkulator-frontend',
  webDir: 'dist/calkulator_frontend',
  server: {
    androidScheme: 'https'
  }
};

export default config;
