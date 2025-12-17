import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.upturn.flow',
  appName: 'Upturn Flow',
  // Use 'build' as the webDir placeholder. When using a remote wrapper
  // we rely on `server.url` so local assets are not required at runtime.
  webDir: '.next/build',
  // For a wrapper app (recommended), set server.url to your deployed site.
  // The WebView will load this URL directly. Replace the placeholder below.
  server: {
    url: 'https://flow.upturn.com.bd/',
    // If you need cleartext HTTP for local dev, set to true and ensure device can reach the host.
    cleartext: false
  }
};

export default config;
