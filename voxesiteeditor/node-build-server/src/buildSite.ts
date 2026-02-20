import { exec } from 'child_process'
import path from 'path'
import fs from 'fs-extra'

export async function buildSite(siteId: string) {
  if (!siteId) throw new Error('siteId requerido')

  const runtimePath = path.resolve('../apps/runtime')
  const runtimeStorageSite = path.resolve(`./runtime_storage/${siteId}`)

  // Carpeta aislada por siteId dentro del public/ del runtime
  // Cada build usa su propio namespace → no se contaminan entre sí
  const isolatedPublicDir = path.join(runtimePath, `public/_builds/${siteId}`)

  // Copiar JSONs de páginas al folder aislado ANTES del generate
  // nuxt.config.ts lee desde public/_builds/{siteId}/data/pages/ para descubrir rutas
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
          // Limpiar carpeta temporal aunque falle
          await fs.remove(isolatedPublicDir).catch(() => {})
          return reject(stderr)
        }

        // Copiar el output de Nuxt al destino final
        const nuxtOutputDir = path.join(runtimePath, `public_builds/${siteId}`)
        const finalBuildDir = path.resolve(`./public_builds/${siteId}`)
        await fs.remove(finalBuildDir)
        await fs.copy(nuxtOutputDir, finalBuildDir)

        // Copiar CSS generado al output final
        // No se pone en public/ antes del generate para evitar contaminación.
        // useHead (SSR) ya inyecta el <link> en el HTML; aquí copiamos el archivo.
        const generatedCssSource = path.join(runtimeStorageSite, 'generated-css')
        if (await fs.pathExists(generatedCssSource)) {
          await fs.copy(generatedCssSource, path.join(finalBuildDir, 'generated-css'), { overwrite: true })
        }

        // Eliminar la carpeta _builds/{siteId} que Nuxt copió al output
        // (era solo datos de build-time, no debe ir al deploy)
        await fs.remove(path.join(finalBuildDir, '_builds'))

        // Limpiar carpeta temporal del runtime public/
        await fs.remove(isolatedPublicDir)

        console.log(`Build completado para site: ${siteId}`)
        resolve()
      }
    )
  })
}
