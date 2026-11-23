type CapacitorConfig = {
  appId: string;
  appName: string;
  webDir: string;
  bundledWebRuntime?: boolean;
  server?: {
    url?: string;
    cleartext?: boolean;
    errorPath?: string;
  };
  plugins?: Record<string, unknown>;
  android?: {
    adjustMarginsForEdgeToEdge?: 'auto' | 'force' | 'disable';
    appendUserAgent?: string;
  };
  ios?: {
    appendUserAgent?: string;
  };
};

// Покоління нативної оболонки (НЕ номер збірки магазину). Сайт читає його з User-Agent (src/lib/nativeApp.ts):
// 1 = без описів дозволів камери/мікрофона (камера вбиває застосунок на iOS), 2 = з описами та правами.
// Піднімайте число, коли нативна частина змінюється так, що сайту треба знати про це.
const SHELL_LEVEL = 2;

// The app is a thin shell around the production site. Defaulting to the production URL guarantees that
// `cap sync` can never produce a build that falls back to the local placeholder page (blank/white screen).
const PRODUCTION_URL = 'https://sviydlyasvoih.com.ua';

const config: CapacitorConfig = {
  appId: 'com.sviy_dlya_svoih.android',
  appName: 'Sviy dlya Svoikh',
  webDir: 'mobile-web',
  ios: { appendUserAgent: `SviyApp/${SHELL_LEVEL}` },
  android: {
    appendUserAgent: `SviyApp/${SHELL_LEVEL}`,
    // Android 15+ enforces edge-to-edge; inset the WebView so content isn't drawn under the system bars
    adjustMarginsForEdgeToEdge: 'auto',
  },
  server: {
    url: process.env.CAPACITOR_SERVER_URL || PRODUCTION_URL,
    cleartext: false,
    // Bilingual local page shown when the site can't be reached (offline / server down) instead of a blank screen
    errorPath: 'error.html',
  },
};

export default config;
