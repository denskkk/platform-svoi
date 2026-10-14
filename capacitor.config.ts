type CapacitorConfig = {
  appId: string;
  appName: string;
  webDir: string;
  bundledWebRuntime?: boolean;
  server?: {
    url?: string;
    cleartext?: boolean;
  };
  plugins?: Record<string, unknown>;
  android?: {
    adjustMarginsForEdgeToEdge?: 'auto' | 'force' | 'disable';
  };
};

const config: CapacitorConfig = {
  appId: 'com.sviy_dlya_svoih.android',
  appName: 'Свій для Своїх',
  webDir: 'out',
  android: {
    // Android 15+ enforces edge-to-edge; inset the WebView so content isn't drawn under the system bars
    adjustMarginsForEdgeToEdge: 'auto',
  },
  ...(process.env.CAPACITOR_SERVER_URL
    ? {
        server: {
          url: process.env.CAPACITOR_SERVER_URL,
          cleartext: false,
        },
      }
    : {}),
};

export default config;
