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
};

const config: CapacitorConfig = {
  appId: 'com.svoi.platform',
  appName: 'Свій для Своїх',
  webDir: 'out',
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
