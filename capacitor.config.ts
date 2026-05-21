import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lingoci.de',
  appName: 'DELingo',
  webDir: 'packages/delingo/dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
