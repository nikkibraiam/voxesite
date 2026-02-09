// apps/editor/server/api/page.post.ts
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import type { Page } from '@cms/contracts'

export default defineEventHandler(async (event) => {
  const page = await readBody<Page>(event)
  const dir = join(process.cwd(), '../../data/pages')
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, `${page.slug}.json`), JSON.stringify(page, null, 2), 'utf-8')
  return { ok: true }
})
