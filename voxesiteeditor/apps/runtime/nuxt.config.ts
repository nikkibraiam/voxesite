import { readdirSync } from 'fs'
import { resolve } from 'path'

const siteId = process.env.SITE_ID || 'default'
const pagesDir = resolve(__dirname, 'public/data/pages')

let routes: string[] = []

try {
  const files = readdirSync(pagesDir)
  routes = files.map(file => '/' + file.replace('.json', ''))
} catch (err) {
  console.warn('No se encontraron páginas:', err)
  routes = []
}

export default defineNuxtConfig({
  ssr: true,
  nitro: {
    output: {
      publicDir: `public_builds/${siteId}`, // build aislado por siteId
    },
    prerender: {
      routes, // prerender dinámico basado en tus JSON
    },
  },

  build: {
    transpile: ["@cms/ui", "@cms/contracts", "@cms/utils"],
  },

  vite: {
    build: {
      rollupOptions: {
        output: {
          // hash dinámico para JS, CSS y assets
          entryFileNames: '[name].[hash].js',
          chunkFileNames: '[name].[hash].js',
          assetFileNames: '[name].[hash].[ext]',
        },
      },
    },
    server: {
      fs: {
        allow: [".."], // permitir acceso a fuera del workspace
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
})
