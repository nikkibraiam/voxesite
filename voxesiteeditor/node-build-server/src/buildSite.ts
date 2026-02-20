import { exec } from 'child_process'
import path from 'path'
import fs from 'fs-extra'

export async function buildSite(siteId: string) {
  if (!siteId) throw new Error('siteId requerido')

  const runtimePath = path.resolve('../apps/runtime') // ruta a tu Nuxt workspace
  const tempBuildDir = path.resolve(`./tmp_builds/${siteId}`) // build temporal

  // Asegurarse que carpeta temporal existe
  await fs.ensureDir(tempBuildDir)

  const runtimeStorageSite = path.resolve(`./runtime_storage/${siteId}`)

  // Copiar los JSONs de páginas al public/ del runtime ANTES del generate
  // Nuxt los lee en nuxt.config.ts para construir las rutas a prerender
  const pagesSource = path.join(runtimeStorageSite, 'data/pages')
  const runtimePublicPagesDir = path.join(runtimePath, 'public/data/pages')
  if (await fs.pathExists(pagesSource)) {
    await fs.copy(pagesSource, runtimePublicPagesDir, { overwrite: true })
  }

  // Copiar CSS generados al public/ del runtime ANTES del generate
  const generatedCssSource = path.join(runtimeStorageSite, 'generated-css')
  const runtimePublicCssDir = path.join(runtimePath, 'public/generated-css')
  if (await fs.pathExists(generatedCssSource)) {
    await fs.copy(generatedCssSource, runtimePublicCssDir, { overwrite: true })
  }

  return new Promise<void>((resolve, reject) => {
    exec(
      `SITE_ID=${siteId} pnpm --filter runtime generate`,
      { cwd: runtimePath, env: { ...process.env, SITE_ID: siteId } },
      async (err, _stdout, stderr) => {
        if (err) {
          console.error(stderr)
          return reject(stderr)
        }

        // Copiar build generado por Nuxt a public_builds/{siteId}
        const nuxtOutputDir = path.join(runtimePath, `public_builds/${siteId}`)
        const finalBuildDir = path.resolve(`./public_builds/${siteId}`)
        await fs.remove(finalBuildDir)
        await fs.copy(nuxtOutputDir, finalBuildDir)

        // Inyectar <link> del CSS en cada HTML de página generada
        // Con ssr:false el useHead no se aplica en el HTML estático,
        // así que lo hacemos manualmente por cada slug
        const entries = await fs.readdir(finalBuildDir)
        for (const entry of entries) {
          const entryPath = path.join(finalBuildDir, entry)
          const stat = await fs.stat(entryPath)
          if (!stat.isDirectory()) continue

          const indexHtml = path.join(entryPath, 'index.html')
          if (!await fs.pathExists(indexHtml)) continue

          const cssFile = path.join(finalBuildDir, 'generated-css', `${entry}.css`)
          if (!await fs.pathExists(cssFile)) continue

          let html = await fs.readFile(indexHtml, 'utf-8')
          const cssLink = `<link rel="stylesheet" href="/generated-css/${entry}.css">`
          html = html.replace('</head>', `${cssLink}</head>`)
          await fs.writeFile(indexHtml, html)
        }

        console.log(`Build completado para site: ${siteId}`)
        resolve()
      }
    )
  })
}
