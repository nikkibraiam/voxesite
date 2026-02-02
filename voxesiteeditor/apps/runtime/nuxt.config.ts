export default defineNuxtConfig({
  ssr: true,
  nitro: {
    preset: 'static'
  },
  build: {
    transpile: ["@cms/ui", "@cms/contracts"],
  },
  vite: {
    server: {
      fs: {
        allow: [".."],
      },
    },
    optimizeDeps: {
      exclude: ["@cms/ui", "@cms/contracts"],
    },
  },
  devServer: {
    port: 3001,
  },
  devtools: {
    enabled: false,
  },
});
