import { exec } from 'child_process'
import path from 'path'
import fs from 'fs-extra'
import crypto from 'crypto'
import { generateNonce, buildCspHeader } from './security/nonceGenerator'

// Hash corto del contenido para cache busting (8 chars de SHA-256)
function contentHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 8)
}

/**
 * Inject `nonce="{nonce}"` into every <script> and <style> opening tag
 * that does not already carry a nonce attribute.
 *
 * Handles tags with and without existing attributes, e.g.:
 *   <script>            → <script nonce="abc">
 *   <style type="text/css">  → <style nonce="abc" type="text/css">
 */
function injectNoncesIntoHtml(html: string, nonce: string): string {
  return html.replace(/<(script|style)(\s[^>]*)?>/gi, (_match, tag: string, attrs: string = '') => {
    if (/\bnonce=/i.test(attrs)) return `<${tag}${attrs}>` // already has nonce
    return `<${tag} nonce="${nonce}"${attrs}>`
  })
}

/**
 * Inject a fallback <meta http-equiv="Content-Security-Policy"> tag into <head>.
 * The HTTP header is the primary delivery; this is a browser-fallback for
 * static hosts that cannot set custom headers.
 */
function injectMetaCsp(html: string, csp: string): string {
  const escapedCsp = csp.replace(/"/g, '&quot;')
  const metaTag = `  <meta http-equiv="Content-Security-Policy" content="${escapedCsp}">`
  return html.replace(/(<\/head>)/i, `${metaTag}\n$1`)
}

export async function buildSite(siteId: string) {
  if (!siteId) throw new Error('siteId requerido')

  const runtimePath = path.resolve('../apps/runtime')
  const runtimeStorageSite = path.resolve(`./runtime_storage/${siteId}`)
  const isolatedPublicDir = path.join(runtimePath, `public/_builds/${siteId}`)

  // Copiar JSONs de páginas al folder aislado ANTES del generate
  const pagesSource = path.join(runtimeStorageSite, 'data/pages')
  if (await fs.pathExists(pagesSource)) {
    await fs.copy(pagesSource, path.join(isolatedPublicDir, 'data/pages'), { overwrite: true })
  }

  return new Promise<void>((resolve, reject) => {
    exec(
      `pnpm --filter runtime generate`,
      { cwd: runtimePath, env: { ...process.env, SITE_ID: siteId } },
      async (err, _stdout, stderr) => {
        if (err) {
          console.error(stderr)
          await fs.remove(isolatedPublicDir).catch(() => {})
          return reject(stderr)
        }

        // Copiar output de Nuxt al destino final
        const nuxtOutputDir = path.join(runtimePath, `public_builds/${siteId}`)
        const finalBuildDir = path.resolve(`./public_builds/${siteId}`)
        await fs.remove(finalBuildDir)
        await fs.copy(nuxtOutputDir, finalBuildDir)

        // Copiar CSS con nombre hasheado para cache busting
        const generatedCssSource = path.join(runtimeStorageSite, 'generated-css')
        const cssHashMap: Record<string, string> = {} // slug → hashed css file name

        if (await fs.pathExists(generatedCssSource)) {
          const cssFiles = await fs.readdir(generatedCssSource)
          for (const file of cssFiles) {
            if (!file.endsWith('.css')) continue
            const slug = file.replace('.css', '')
            const content = await fs.readFile(path.join(generatedCssSource, file), 'utf-8')
            const hash = contentHash(content)
            const hashedName = `${slug}.${hash}.css`
            await fs.copy(
              path.join(generatedCssSource, file),
              path.join(finalBuildDir, 'generated-css', hashedName)
            )
            cssHashMap[slug] = hashedName
          }
        }

        // ─── Post-process HTML: inject CSP nonces ────────────────────────────
        //
        // Each page HTML file gets a fresh cryptographic nonce.  The nonce is:
        //   1. Injected as nonce="" attribute on every <script> and <style> tag
        //   2. Written into a <meta http-equiv="Content-Security-Policy"> fallback
        //   3. Saved to a {slug}.headers.json sidecar for Express / CDN pickup
        //
        // A {slug}.headers.json sidecar contains the full set of security headers
        // for that page; the Express static-serving middleware reads it and sets
        // them on every response for that slug.

        const headersMap: Record<string, Record<string, string>> = {}
        const netlifyPerPageRules: string[] = []

        const sharedSecurityHeaders: Record<string, string> = {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        }

        const entries = await fs.readdir(finalBuildDir)
        for (const entry of entries) {
          const entryPath = path.join(finalBuildDir, entry)
          if (!(await fs.stat(entryPath)).isDirectory()) continue

          const indexHtml = path.join(entryPath, 'index.html')
          if (!(await fs.pathExists(indexHtml))) continue

          let html = await fs.readFile(indexHtml, 'utf-8')

          // Update <link> CSS reference to hashed filename
          const hashedCssName = cssHashMap[entry]
          if (hashedCssName) {
            html = html.replace(
              `/generated-css/${entry}.css`,
              `/generated-css/${hashedCssName}`
            )
          }

          // Generate a unique nonce for this HTML file
          const nonce = generateNonce()
          const csp = buildCspHeader(nonce, { context: 'published' })

          // Inject nonce attributes and fallback meta tag
          html = injectNoncesIntoHtml(html, nonce)
          html = injectMetaCsp(html, csp)

          await fs.writeFile(indexHtml, html)

          // Write sidecar headers file: {slug}.headers.json
          const pageHeaders = { 'Content-Security-Policy': csp, ...sharedSecurityHeaders }
          const headersFilePath = path.join(finalBuildDir, `${entry}.headers.json`)
          await fs.writeFile(headersFilePath, JSON.stringify(pageHeaders, null, 2))

          headersMap[entry] = pageHeaders

          // Netlify/Cloudflare _headers per-page rule
          const netlifyHeaderLines = Object.entries(pageHeaders)
            .map(([k, v]) => `  ${k}: ${v}`)
            .join('\n')
          netlifyPerPageRules.push(`/${entry}/*\n${netlifyHeaderLines}`)
        }

        // Write _headers file (Netlify / Cloudflare Pages CDN format).
        // Per-page rules (with nonce) appear first; shared fallback rule last.
        const sharedHeaderLines = Object.entries(sharedSecurityHeaders)
          .map(([k, v]) => `  ${k}: ${v}`)
          .join('\n')
        const netlifyHeaders =
          netlifyPerPageRules.join('\n') + `\n/*\n${sharedHeaderLines}\n`

        await fs.writeFile(path.join(finalBuildDir, '_headers'), netlifyHeaders)

        // Limpiar carpeta temporal del runtime public/
        await fs.remove(path.join(finalBuildDir, '_builds'))
        await fs.remove(isolatedPublicDir)

        console.log(`Build completado para site: ${siteId}`)
        resolve()
      }
    )
  })
}
