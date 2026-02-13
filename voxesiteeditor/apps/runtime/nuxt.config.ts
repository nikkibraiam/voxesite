import { readdirSync } from 'fs'
import { resolve } from 'path'

const pagesDir = resolve(__dirname, 'public/data/pages')

let routes: string[] = []

try {
  const files = readdirSync(pagesDir)
  routes = files.map(file => '/' + file.replace('.json', ''))
} catch {
  routes = []
}

export default defineNuxtConfig({
  ssr: true,
  nitro: {
    preset: 'static',
    prerender: {
      routes
    }
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
