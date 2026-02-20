import { exec } from 'child_process'
import path from 'path'
import fs from 'fs-extra'
import crypto from 'crypto'

// Hash corto del contenido para cache busting (8 chars de SHA-256)
function contentHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 8)
}

// Hash SHA-256 en base64 para CSP (formato: sha256-<base64>)
function sha256Base64(content: string): string {
  return crypto.createHash('sha256').update(content).digest('base64')
}

// Extrae todos los bloques <style>...</style> e <script>...</script> inline del HTML
function extractInlineBlocks(html: string): { styles: string[], scripts: string[] } {
  const styles: string[] = []
  const scripts: string[] = []

  for (const match of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
    if (match[1].trim()) styles.push(match[1])
  }
  for (const match of html.matchAll(/<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi)) {
    if (match[1].trim()) scripts.push(match[1])
  }

  return { styles, scripts }
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
        // Ejemplo: home.css → home.a3f9c1d2.css
        const generatedCssSource = path.join(runtimeStorageSite, 'generated-css')
        const cssHashMap: Record<string, string> = {} // slug → nombre de archivo hasheado

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

        // Post-procesar cada HTML de página
        const allCspStyleHashes = new Set<string>()
        const allCspScriptHashes = new Set<string>()

        const entries = await fs.readdir(finalBuildDir)
        for (const entry of entries) {
          const entryPath = path.join(finalBuildDir, entry)
          if (!(await fs.stat(entryPath)).isDirectory()) continue

          const indexHtml = path.join(entryPath, 'index.html')
          if (!await fs.pathExists(indexHtml)) continue

          let html = await fs.readFile(indexHtml, 'utf-8')

          // Actualizar <link> del CSS al nombre hasheado
          const hashedCssName = cssHashMap[entry]
          if (hashedCssName) {
            html = html.replace(
              `/generated-css/${entry}.css`,
              `/generated-css/${hashedCssName}`
            )
          }

          // Calcular hashes CSP de estilos e scripts inline
          const { styles, scripts } = extractInlineBlocks(html)
          for (const style of styles) allCspStyleHashes.add(`'sha256-${sha256Base64(style)}'`)
          for (const script of scripts) allCspScriptHashes.add(`'sha256-${sha256Base64(script)}'`)

          await fs.writeFile(indexHtml, html)
        }

        // Generar _headers con la política CSP para el deploy
        // Compatible con Netlify, Cloudflare Pages, etc.
        const styleHashes = [...allCspStyleHashes].join(' ')
        const scriptHashes = [...allCspScriptHashes].join(' ')

        const cspHeader = [
          `default-src 'self'`,
          `script-src 'self' ${scriptHashes}`,
          `style-src 'self' ${styleHashes}`,
          `font-src 'self' data:`,
          `img-src 'self' data:`,
        ].join('; ')

        await fs.writeFile(
          path.join(finalBuildDir, '_headers'),
          `/*\n  Content-Security-Policy: ${cspHeader}\n`
        )

        // Limpiar carpeta temporal del runtime public/
        await fs.remove(path.join(finalBuildDir, '_builds'))
        await fs.remove(isolatedPublicDir)

        console.log(`Build completado para site: ${siteId}`)
        resolve()
      }
    )
  })
}
