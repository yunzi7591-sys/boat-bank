import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'jp.boatbank.app',
  appName: 'BOAT BANK',
  webDir: 'public',
  server: {
    url: 'https://boatbank.jp',
    cleartext: false,
    androidScheme: 'https',
  },
  ios: {
    contentInset: 'never',
    limitsNavigationsToAppBoundDomains: false,
    backgroundColor: '#ffffff',
  },
  backgroundColor: '#ffffff',
  android: {
    allowMixedContent: false,
  },
  plugins: {
    Keyboard: {
      // 'none' = キーボードを画面に重ねて表示するだけで body は変えない
      // → スクロール領域が壊れない
      resize: 'none',
    },
  },
};

export default config;
