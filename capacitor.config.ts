import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: "com.planora.app",
  appName: "Planora",
  webDir: "dist",
  bundledWebRuntime: false,
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,       // time in ms
      launchAutoHide: true,           // auto hide after duration
      backgroundColor: "#ffffffff",   // white background
      androidSplashResourceName: "splash",  // image name
      showSpinner: false
    }
  }
};

export default config;
