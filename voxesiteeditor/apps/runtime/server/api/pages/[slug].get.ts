// apps/runtime/server/api/pages/[slug].get.ts
import { readFile } from 'fs/promises'
import { join } from 'path'
import type { Page } from '@cms/contracts'

export default defineEventHandler(async (event): Promise<Page> => {
  const slug = event.context.params!.slug
  const filePath = join(process.cwd(), '../../data/pages', `${slug}.json`)

  try {
    const json = await readFile(filePath, 'utf-8')
    return JSON.parse(json)
  } catch (err) {
    // Si no existe, retorna null o un objeto vacío para evitar romper Nuxt
    return null as any
  }
})
