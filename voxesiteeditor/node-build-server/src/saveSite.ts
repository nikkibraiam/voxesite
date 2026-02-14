import { writeFile, mkdir } from 'fs/promises'
import { resolve, join } from 'path'

export async function saveSite(
  siteId: string,
  slug: string,
  json: any,
  css: string,
  cssFileName: string
) {
  if (!siteId) throw new Error('siteId requerido')
  if (!slug) throw new Error('slug requerido')

  const baseDir = resolve(`./runtime_storage/${siteId}`)

  const jsonDir = join(baseDir, 'data/pages')
  const cssDir = join(baseDir, 'generated-css')

  await mkdir(jsonDir, { recursive: true })
  await mkdir(cssDir, { recursive: true })

  await writeFile(
    join(jsonDir, `${slug}.json`),
    JSON.stringify(json, null, 2),
    'utf-8'
  )

  await writeFile(
    join(cssDir, cssFileName),
    css,
    'utf-8'
  )

  return { ok: true }
}
