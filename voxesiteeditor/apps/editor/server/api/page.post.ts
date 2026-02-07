import { writeFile } from 'fs/promises'
import type { Page } from '@cms/contracts'

export default defineEventHandler(async (event) => {
  const page = await readBody<Page>(event)

  await writeFile(
    `./data/pages/${page.slug}.json`,
    JSON.stringify(page, null, 2),
    'utf-8'
  )

  return { ok: true }
})
