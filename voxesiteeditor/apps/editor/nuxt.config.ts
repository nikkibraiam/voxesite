export default defineNuxtConfig({
  modules: ['@pinia/nuxt'],
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
