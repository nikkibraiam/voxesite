import { readFile } from 'fs/promises'
import { resolve, join } from 'path'

export async function readSite(
  siteId: string,
  slug: string
) {
  if (!siteId) throw new Error('siteId requerido')
  if (!slug) throw new Error('slug requerido')

  const baseDir = resolve(`./runtime_storage/${siteId}`)
  const jsonPath = join(baseDir, 'data/pages', `${slug}.json`)

  const file = await readFile(jsonPath, 'utf-8')

  return {
    ok: true,
    data: JSON.parse(file)
  }
}
