import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

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
      resize: KeyboardResize.None,
    },
  },
};

export default config;
