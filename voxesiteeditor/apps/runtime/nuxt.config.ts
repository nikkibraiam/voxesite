import { readdirSync } from 'fs'
import { resolve } from 'path'

const siteId = process.env.SITE_ID || 'default'
// Carpeta aislada por siteId para evitar contaminación entre builds concurrentes
const pagesDir = resolve(__dirname, `public/_builds/${siteId}/data/pages`)

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

  // ── CSP nonce injection via render:html hook ─────────────────────────────
  //
  // The CSP middleware (server/middleware/csp.ts) generates a nonce per request
  // and stores it on event.context.cspNonce.  This hook reads that nonce and
  // injects nonce="..." onto every <script> and <style> tag emitted by Nuxt
  // (including hydration scripts, inline styles, etc.) so they pass CSP checks.
  //
  // Without this hook, Nuxt's own hydration <script> blocks would be blocked by
  // the strict script-src 'nonce-xxx' policy.
  hooks: {
    'render:html'(html, { event }) {
      const nonce: string | undefined = (event as any)?.context?.cspNonce
      if (!nonce) return

      /**
       * Inject nonce="..." into the opening tag of every <script> and <style>
       * that does not already carry a nonce attribute.
       *
       * Matches:
       *   <script>                    → <script nonce="abc">
       *   <script type="module">      → <script nonce="abc" type="module">
       *   <style>                     → <style nonce="abc">
       *   <script nonce="existing">   → unchanged
       */
      const injectNonce = (fragment: string): string =>
        fragment.replace(
          /<(script|style)(\s[^>]*)?>/gi,
          (_match: string, tag: string, attrs: string = '') => {
            if (/\bnonce=/i.test(attrs)) return `<${tag}${attrs}>`
            return `<${tag} nonce="${nonce}"${attrs}>`
          }
        )

      html.head = html.head.map(injectNonce)
      html.bodyPrepend = html.bodyPrepend.map(injectNonce)
      html.body = html.body.map(injectNonce)
      html.bodyAppend = html.bodyAppend.map(injectNonce)
    },
  },

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
