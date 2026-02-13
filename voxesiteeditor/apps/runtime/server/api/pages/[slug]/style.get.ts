import { readFile } from 'fs/promises'
import { join, resolve } from 'path'
import type { Page } from '@cms/contracts'
import { generateBlockCss } from '@cms/utils'

function generatePageCss(page: Page) {
  let css = ''

  for (const block of page.blocks) {
    css += generateBlockCss(block)
  }

  return css
}

function generateCSS(page: Page): string {
  const css = generatePageCss(page)
  return css
}

export default defineEventHandler(async (event) => {
  const slug = event.context.params?.slug
  const dir = resolve(process.cwd(), 'public/data/pages')

  const filePath = join(dir, `${slug}.json`)

  try {
    const raw = await readFile(filePath, 'utf-8')
    const page: Page = JSON.parse(raw)

    setHeader(event, 'Content-Type', 'text/css')
    setHeader(event, 'Cache-Control', 'no-store')

    return generateCSS(page)
  } catch {
    return ''
  }
})
