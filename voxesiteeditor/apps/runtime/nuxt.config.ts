export default defineNuxtConfig({
  ssr: true,
  nitro: {
    preset: 'static'
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
    port: 3001,
  },
  devtools: {
    enabled: false,
  },
});
