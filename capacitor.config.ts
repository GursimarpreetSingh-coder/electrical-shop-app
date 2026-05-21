import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rattanelectricals.voltixerp',
  appName: 'Voltix ERP',
  webDir: 'public',
  server: {
    url: 'https://rattan-electricals.web.app',
    cleartext: true
  }
};

export default config;
