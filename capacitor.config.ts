import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.planmytrip.app',
  appName: 'PlanMyTrip',
  webDir: 'dist',
  server: {
    url: 'https://www.planmytripai.in',
    androidScheme: 'https'
  }
};

export default config;
