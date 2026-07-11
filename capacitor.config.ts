import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'jp.boatbank.app',
  appName: 'BOAT BANK',
  // アプリはserver.urlから読み込むため、同梱アセットは空のプレースホルダのみ（サイズ削減）
  webDir: 'capacitor-shell',
  // アプリのWebViewだけがUser-Agentに名乗る識別子。
  // サーバー側の「アプリ限定機能」（星評価など）の判定に使う
  appendUserAgent: 'BoatBankApp',
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
