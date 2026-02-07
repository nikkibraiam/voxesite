import { readFile } from 'fs/promises'
import type { Page } from '@cms/contracts'

export default defineEventHandler(async (event): Promise<Page> => {
  const slug = event.context.params!.slug

  const json = await readFile(
    `./data/pages/${slug}.json`,
    'utf-8'
  )

  return JSON.parse(json)
})
