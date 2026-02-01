export default defineNuxtConfig({
  alias: {
    "@cms/ui": new URL("../../packages/ui/index.ts", import.meta.url).pathname,
    "@cms/contracts": new URL("../../packages/contracts/index.ts", import.meta.url).pathname,
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
});
