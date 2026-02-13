import { exec } from 'child_process'
import path from 'path'
import fs from 'fs-extra'

export async function buildSite(siteId: string) {
  if (!siteId) throw new Error('siteId requerido')

  const runtimePath = path.resolve('../apps/runtime') // ruta a tu Nuxt workspace
  const tempBuildDir = path.resolve(`./tmp_builds/${siteId}`) // build temporal

  // Asegurarse que carpeta temporal existe
  await fs.ensureDir(tempBuildDir)

  return new Promise<void>((resolve, reject) => {
    exec(
      `SITE_ID=${siteId} pnpm --filter runtime generate`,
      { cwd: runtimePath, env: { ...process.env, SITE_ID: siteId } },
      async (err, stdout, stderr) => {
        if (err) {
          console.error(stderr)
          return reject(stderr)
        }

        // Mover carpeta build temporal a public_builds/{siteId}
        const finalBuildDir = path.resolve(`./public_builds/${siteId}`)
        await fs.remove(finalBuildDir)
        await fs.move(path.join(runtimePath, 'public'), finalBuildDir)

        console.log(`Build completado para site: ${siteId}`)
        resolve()
      }
    )
  })
}
