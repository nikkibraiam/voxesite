export default defineNuxtConfig({
  modules: ['@pinia/nuxt'],
  runtimeConfig: {
    public: {
      // WebSocket URL for voice transcription — override with NUXT_PUBLIC_WS_URL env var
      wsUrl: 'ws://localhost:2999',
    },
  },
  build: {
    transpile: ["@cms/ui", "@cms/contracts", "@cms/utils"],
  },
  vite: {
    server: {
      fs: {
        allow: [".."],
      },
    },
    optimizeDeps: {
      exclude: ["@cms/ui", "@cms/contracts", "@cms/utils"],
    },
  },
  devServer: {
    port: 3000,
  },
  devtools: {
    enabled: false,
  },
});
