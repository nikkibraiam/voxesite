export default defineNuxtConfig({
  alias: {
    "@cms/contracts": "../../packages/contracts",
    "@cms/ui": "../../packages/ui",
    "@cms/utils": "../../packages/utils",
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
    port: 3000,
  },
});
